import nodemailer from "nodemailer";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function smtpConfigured() {
  return process.env.SMTP_ENABLED !== "false"
    && Boolean(process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD);
}

export function getSmtpTransport() {
  const host = required("SMTP_HOST");
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: required("SMTP_USERNAME"), pass: required("SMTP_PASSWORD") },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    tls: { servername: host, minVersion: "TLSv1.2" },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export function smtpFromAddress() {
  return process.env.SMTP_FROM_EMAIL?.trim() || required("SMTP_USERNAME");
}
