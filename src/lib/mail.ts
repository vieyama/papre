import "server-only";

import nodemailer from "nodemailer";
import { defaultLocale, type Locale } from "@/i18n/config";

const PASSWORD_RESET_EMAIL_CONTENT: Record<
  Locale,
  {
    subject: string;
    text: (resetUrl: string) => string;
    html: (resetUrl: string) => string;
  }
> = {
  en: {
    subject: "Reset your Papre password",
    text: (resetUrl) =>
      [
        "We received a request to reset your Papre account password.",
        "",
        `Open the following link to set a new password: ${resetUrl}`,
        "",
        "This link is valid for 1 hour. Ignore this email if you did not request a password reset.",
      ].join("\n"),
    html: (resetUrl) => `
      <p>We received a request to reset your Papre account password.</p>
      <p><a href="${resetUrl}">Set a new password</a></p>
      <p>This link is valid for 1 hour. Ignore this email if you did not request a password reset.</p>
    `,
  },
  id: {
    subject: "Reset password Papre",
    text: (resetUrl) =>
      [
        "Kami menerima permintaan untuk mereset password akun Papre Anda.",
        "",
        `Buka tautan berikut untuk membuat password baru: ${resetUrl}`,
        "",
        "Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.",
      ].join("\n"),
    html: (resetUrl) => `
      <p>Kami menerima permintaan untuk mereset password akun Papre Anda.</p>
      <p><a href="${resetUrl}">Buat password baru</a></p>
      <p>Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.</p>
    `,
  },
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  const fromAddress = process.env.SMTP_FROM_ADDRESS;
  const fromName = process.env.SMTP_FROM_NAME || "Papre";

  if (!host || !Number.isInteger(port) || !user || !pass || !fromAddress) {
    throw new Error("SMTP configuration is incomplete");
  }

  return { host, port, user, pass, fromAddress, fromName };
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  lang: Locale = defaultLocale,
) {
  const config = getSmtpConfig();
  const htmlResetUrl = resetUrl.replaceAll("&", "&amp;");
  const content = PASSWORD_RESET_EMAIL_CONTENT[lang];
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: {
      name: config.fromName,
      address: config.fromAddress,
    },
    to: email,
    subject: content.subject,
    text: content.text(resetUrl),
    html: content.html(htmlResetUrl),
  });
}
