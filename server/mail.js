import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(process.env.SMTP_URL || process.env.SMTP_HOST);
}

export function mailConfigured() {
  return smtpConfigured();
}

function createTransport() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendLoginOtp(email, code) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "FACERIGHTS <noreply@facetroop.com>";
  const subject = "Your FACERIGHTS login code";
  const text = `Your one-time login code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family:Georgia,serif;background:#f4f1e9;padding:32px;color:#172016">
      <p style="letter-spacing:.16em;font-size:12px;text-transform:uppercase;font-weight:700">FACERIGHTS</p>
      <h1 style="font-size:28px;margin:12px 0 16px">Your login code</h1>
      <p style="font-size:32px;letter-spacing:.24em;font-weight:700">${code}</p>
      <p style="color:#5e685c">This code expires in 10 minutes.</p>
    </div>
  `;

  const transport = createTransport();
  if (!transport) {
    console.log(`[login-otp] SMTP is not configured. Code for ${email}: ${code}`);
    return { delivered: false };
  }

  await transport.sendMail({ from, to: email, subject, text, html });
  return { delivered: true };
}
