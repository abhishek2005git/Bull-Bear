import { inngest } from "./client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { formatDateToday } from "../utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
      - Country: ${event.data.country}
      - Investment goals: ${event.data.investmentGoals}
      - Risk Tolerance: ${event.data.riskTolerance}
      - Preferred Industry: ${event.data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{ userProfile }}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      // You can add your actual email sending logic here using `introText`
      //console.log("Generated intro:", introText);

      const { data: { email, name } } = event;

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      })
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }],
  async ({ event, step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || !Array.isArray(users) || users.length === 0) {
      return {
        success: false,
        message: "No users found for news delivery",
      };
    }

    // Step #2: Fetch personalized news for each user
    const newsData = await step.run("fetch-news-for-users", async () => {
      const { getWatchlistSymbolsByEmail } = await import("../actions/watchlist.actions");
      const { getNews } = await import("../actions/finnhub.actions");

      const userNewsPromises = users.map(async (user) => {
        try {
          // Get user's watchlist symbols
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          // Fetch news based on watchlist (or general news if no watchlist)
          const news = symbols.length > 0
            ? await getNews(symbols)
            : await getNews();

          return {
            user,
            news: news.slice(0, 6), // Max 6 articles per user
          };
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error);
          return {
            user,
            news: [],
          };
        }
      });

      return await Promise.all(userNewsPromises);
    });

    // Step #3: Summarize news via AI for each user (placeholder)
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for(const {user, news } of newsData) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace("{{newsData}}", JSON.stringify(news, null, 2));

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const summary = part && "text" in part ? part.text : null;
        userNewsSummaries.push({ user, newsContent: summary });
      } catch (error) {
        console.error(`Error summarizing news for user ${user.email}:`, error);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: Send emails to users with summaries (placeholder)
    await step.run("send-news-emails", async () => {
      // TODO: Implement email sending logic here
      //console.log(`Prepared to send emails to ${summaries.length} users`);
      // You can implement the actual email sending using your email service
      // Example: await sendNewsEmail({ email: user.email, name: user.name, news, summary })

      await Promise.all(userNewsSummaries.map(async ({user, newsContent}) => {
        if(!newsContent) {
          console.error(`No news content for user ${user.email}`);
          return;
        }
        return await sendNewsSummaryEmail({email: user.email, date: formatDateToday(), newsContent});
      }));
      

      
    });

    return {
      success: true,
      message: `Daily news summary sent successfully to ${users.length} users`,
    };
  }
);
