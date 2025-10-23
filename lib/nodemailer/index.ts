import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_KEY,
  },
});

export const sendWelcomeEmail = async ({email, name, intro}: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace("{{intro}}", intro);

    const mailOptions = {
        from: `"Bull-Bear <bull-bear@gmail.com>"`,
        to: email,
        subject: `Welcome to Bull-Bear! - Your Journey to Financial Freedom Begins Here`,
        html: htmlTemplate,
        text: 'Welcome to Bull-Bear! We are thrilled to have you on board. Your journey to financial freedom begins here.',
    }
    await transporter.sendMail(mailOptions);
};
