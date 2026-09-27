import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

const requiredTables = ["newsletter_subscribers", "newsletter_consent_events", "newsletter_campaigns", "newsletter_outbox"] as const;

async function main() {
  const placeholders = requiredTables.map(() => "?").join(",");
  const [tables] = await pool.query<RowDataPacket[]>(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`, [...requiredTables]);
  const found = new Set(tables.map((row) => String(row.TABLE_NAME ?? row.table_name)));
  const missingTables = requiredTables.filter((table) => !found.has(table));
  if (missingTables.length) throw new Error(`Newsletter schema is missing: ${missingTables.join(", ")}`);

  const [subscriberCounts] = await pool.query<RowDataPacket[]>("SELECT status, COUNT(*) AS total FROM newsletter_subscribers GROUP BY status");
  const [campaignCounts] = await pool.query<RowDataPacket[]>("SELECT status, COUNT(*) AS total FROM newsletter_campaigns GROUP BY status");
  const [outboxCounts] = await pool.query<RowDataPacket[]>("SELECT status, COUNT(*) AS total FROM newsletter_outbox GROUP BY status");
  console.log(JSON.stringify({ schemaReady: true, requiredTables, subscriberCounts, campaignCounts, outboxCounts, personalDataPrinted: false, deliveryAttempted: false }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Newsletter backend inspection failed.");
  process.exitCode = 1;
}).finally(() => pool.end());
