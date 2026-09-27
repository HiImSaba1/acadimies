import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";
import { buildDoubleOptInMessage, doubleOptInPayloadSchema } from "../src/features/newsletter/confirmation-message";
import { getSmtpTransport, smtpConfigured, smtpFromAddress } from "../src/lib/email/smtp";

type OutboxRow = RowDataPacket & { id: string; recipient_email: string; payload: unknown; attempts: number };
const apply = process.env.ACADIMIES_NEWSLETTER_CONFIRMATION_APPLY === "1";
const limit = Math.min(Math.max(Number.parseInt(process.env.ACADIMIES_NEWSLETTER_CONFIRMATION_LIMIT ?? "20", 10) || 20, 1), 50);
const lockName = "acadimies-newsletter-double-opt-in";

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Newsletter confirmation delivery is restricted to next_acadimies.");
  let [candidates] = await pool.query<OutboxRow[]>(`SELECT id, recipient_email, payload, attempts FROM newsletter_outbox
    WHERE kind = 'double_opt_in' AND status = 'pending' AND attempts < 3 ORDER BY created_at ASC LIMIT ?`, [limit]);
  const summary = { mode: apply ? "bounded-apply" : "dry-run", target, eligible: candidates.length, limit,
    attempted: 0, sent: 0, failed: 0, suppressed: 0, campaignDeliveryAttempted: false,
    personalDataPrinted: false, tokensPrinted: false, databaseWrites: false };
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ ...summary, smtpReady: smtpConfigured() }, null, 2)}\n`);
    return;
  }
  if (!smtpConfigured()) throw new Error("SMTP is disabled or incomplete. No email was sent.");
  const [locks] = await pool.query<RowDataPacket[]>("SELECT GET_LOCK(?, 0) AS acquired", [lockName]);
  if (Number(locks[0]?.acquired ?? 0) !== 1) throw new Error("Another newsletter confirmation worker is active.");
  [candidates] = await pool.query<OutboxRow[]>(`SELECT id, recipient_email, payload, attempts FROM newsletter_outbox
    WHERE kind = 'double_opt_in' AND status = 'pending' AND attempts < 3 ORDER BY created_at ASC LIMIT ?`, [limit]);
  summary.eligible = candidates.length;
  let transport: ReturnType<typeof getSmtpTransport> | null = null;
  try {
    transport = getSmtpTransport();
    for (const candidate of candidates) {
      summary.attempted += 1;
      let rawPayload: unknown = candidate.payload;
      if (typeof rawPayload === "string") {
        try { rawPayload = JSON.parse(rawPayload); } catch { rawPayload = null; }
      }
      const payload = doubleOptInPayloadSchema.safeParse(rawPayload);
      if (!payload.success || new Date(payload.data.expiresAt).getTime() <= Date.now()) {
        await pool.query("UPDATE newsletter_outbox SET status = 'suppressed', attempts = attempts + 1, last_error = ? WHERE id = ? AND status = 'pending'", ["Confirmation payload is invalid or expired.", candidate.id]);
        summary.suppressed += 1;
        continue;
      }
      try {
        const message = buildDoubleOptInMessage(payload.data, process.env.NEWSLETTER_PUBLIC_ORIGIN);
        await transport.sendMail({ from: `Acadimies Newsletter <${smtpFromAddress()}>`, to: candidate.recipient_email,
          subject: message.subject, text: message.text, html: message.html });
        await pool.query("UPDATE newsletter_outbox SET status = 'sent', attempts = attempts + 1, last_error = NULL, sent_at = UTC_TIMESTAMP(3) WHERE id = ? AND status = 'pending'", [candidate.id]);
        summary.sent += 1;
      } catch {
        const nextAttempts = candidate.attempts + 1;
        await pool.query("UPDATE newsletter_outbox SET status = ?, attempts = attempts + 1, last_error = ? WHERE id = ? AND status = 'pending'", [nextAttempts >= 3 ? "failed" : "pending", "SMTP delivery failed.", candidate.id]);
        summary.failed += 1;
      }
    }
  } finally {
    transport?.close();
    await pool.query("SELECT RELEASE_LOCK(?)", [lockName]);
  }
  process.stdout.write(`${JSON.stringify({ ...summary, databaseWrites: summary.attempted > 0 }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Newsletter confirmation delivery failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
