'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

type FetchOptions = {
  revalidateSeconds?: number;
};

export const fetchJSON = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  const fetchOptions: RequestInit = options?.revalidateSeconds
    ? {
        cache: 'force-cache',
        next: { revalidate: options.revalidateSeconds },
      }
    : { cache: 'no-store' };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getNews = async (
  symbols?: string[]
): Promise<MarketNewsArticle[]> => {
  try {
    const { from, to } = getDateRange(5);

    // If symbols exist, fetch company news
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (cleanedSymbols.length === 0) {
        // Fallback to general news if no valid symbols
        return await fetchGeneralNews(from, to);
      }

      const articles: MarketNewsArticle[] = [];
      const maxRounds = 6;

      // Round-robin through symbols to collect news
      for (let round = 0; round < maxRounds; round++) {
        const symbolIndex = round % cleanedSymbols.length;
        const symbol = cleanedSymbols[symbolIndex];

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
          const news = await fetchJSON<RawNewsArticle[]>(url);

          if (news && news.length > 0) {
            // Find the first valid article not yet included
            const validArticle = news.find((article) => {
              const isValid = validateArticle(article);
              const notDuplicate = !articles.some(
                (existing) => existing.url === article.url
              );
              return isValid && notDuplicate;
            });

            if (validArticle) {
              const formatted = formatArticle(validArticle, true, symbol, round);
              articles.push(formatted);
            }
          }
        } catch (error) {
          console.error(`Error fetching news for ${symbol}:`, error);
          // Continue to next symbol on error
        }

        // Stop if we've collected 6 articles
        if (articles.length >= 6) break;
      }

      // Sort by datetime (newest first) and return
      return articles.sort((a, b) => b.datetime - a.datetime);
    }

    // No symbols provided, fetch general market news
    return await fetchGeneralNews(from, to);
  } catch (error) {
    console.error('Error in getNews:', error);
    throw new Error('Failed to fetch news');
  }
};

const fetchGeneralNews = async (
  from: string,
  to: string
): Promise<MarketNewsArticle[]> => {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const news = await fetchJSON<RawNewsArticle[]>(url);

    if (!news || news.length === 0) {
      return [];
    }

    // Deduplicate by id, url, and headline
    const seen = new Set<string>();
    const uniqueArticles: RawNewsArticle[] = [];

    for (const article of news) {
      if (!validateArticle(article)) continue;

      const key = `${article.id}-${article.url}-${article.headline}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(article);
      }
    }

    // Take top 6 and format them
    return uniqueArticles
      .slice(0, 6)
      .map((article, index) => formatArticle(article, false, undefined, index));
  } catch (error) {
    console.error('Error fetching general news:', error);
    return [];
  }
};
