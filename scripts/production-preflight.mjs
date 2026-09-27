import { access, constants, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

const environmentPath = resolve(process.cwd(), ".env.production.local");
if (!existsSync(environmentPath)) throw new Error("Missing .env.production.local in the application root.");
loadEnvFile(environmentPath);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const credentials = `${encodeURIComponent(required("DB_USER"))}:${encodeURIComponent(process.env.DB_PASSWORD ?? "")}`;
  return `mysql://${credentials}@${required("DB_HOST")}:${process.env.DB_PORT ?? "3306"}/${required("DB_NAME")}`;
}

async function main() {
  const blockers = [];
  const checks = {};
  if (required("NEXT_PUBLIC_SITE_URL") !== "https://acadimies.gr" || required("NEXTAUTH_URL") !== "https://acadimies.gr") blockers.push("canonical-origin");
  if (required("PUBLICATION_DATA_SOURCE") !== "database") blockers.push("publication-data-source");
  if ((process.env.NEXTAUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "").length < 32) blockers.push("admin-session-secret");
  if ((process.env.ADMIN_PASSWORD ?? "").length < 12 || !(process.env.ADMIN_USERNAME ?? "").trim()) blockers.push("admin-owner");
  if (process.env.ACADIMIES_CAMPAIGN_DELIVERY_ENABLED !== "false") blockers.push("campaign-delivery-must-be-disabled");
  if (process.env.ACADIMIES_NEWSLETTER_CONFIRMATION_APPLY === "1") blockers.push("confirmation-delivery-must-be-dry-run");

  const url = databaseUrl();
  const parsedDatabase = new URL(url);
  if (parsedDatabase.pathname.replace(/^\//, "") !== "next_acadimies") blockers.push("database-name");
  if (["root", "admin"].includes(decodeURIComponent(parsedDatabase.username).toLowerCase())) blockers.push("dedicated-database-user");
  const connection = await mysql.createConnection(url);
  try {
    await connection.query("SELECT 1");
    checks.database = { reachable: true, dedicatedUser: !blockers.includes("dedicated-database-user") };
  } finally {
    await connection.end();
  }

  const publicImages = resolve(process.cwd(), "public", "images");
  await access(publicImages, constants.R_OK);
  checks.publicImages = { path: publicImages, readable: true, runtimeWritableRequired: false };
  checks.applicationRoot = { path: process.cwd(), isDirectory: (await stat(process.cwd())).isDirectory() };

  const smtpEnabled = process.env.SMTP_ENABLED === "true";
  if (!smtpEnabled) blockers.push("smtp-disabled");
  if (smtpEnabled) {
    const host = required("SMTP_HOST");
    const transport = nodemailer.createTransport({
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
    await transport.verify();
    transport.close();
    checks.smtp = { verified: true, messageSent: false };
  }

  process.stdout.write(`${JSON.stringify({ mode: "production-preflight", blockers, checks,
    safety: { databaseWrites: false, emailSent: false, secretsPrinted: false } }, null, 2)}\n`);
  if (blockers.length) throw new Error(`Production preflight blockers: ${blockers.join(", ")}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Production preflight failed."} No secrets were printed.\n`);
  process.exitCode = 1;
});
