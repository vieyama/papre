import "server-only";

import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  const fromAddress = process.env.SMTP_FROM_ADDRESS;
  const fromName = process.env.SMTP_FROM_NAME || "MyDJournal";

  if (!host || !Number.isInteger(port) || !user || !pass || !fromAddress) {
    throw new Error("SMTP configuration is incomplete");
  }

  return { host, port, user, pass, fromAddress, fromName };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const config = getSmtpConfig();
  const htmlResetUrl = resetUrl.replaceAll("&", "&amp;");
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
    subject: "Reset password MyDJournal",
    text: [
      "Kami menerima permintaan untuk mereset password akun MyDJournal Anda.",
      "",
      `Buka tautan berikut untuk membuat password baru: ${resetUrl}`,
      "",
      "Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.",
    ].join("\n"),
    html: `
      <p>Kami menerima permintaan untuk mereset password akun MyDJournal Anda.</p>
      <p><a href="${htmlResetUrl}">Buat password baru</a></p>
      <p>Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.</p>
    `,
  });
}
