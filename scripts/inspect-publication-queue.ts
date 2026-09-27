import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Publication queue inspection is restricted to next_acadimies.");
  const [queueRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM posts WHERE status = 'scheduled'");
  const [runRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM audit_events WHERE action = 'article.scheduler_run'");
  const [failureRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM audit_events WHERE action = 'article.scheduled_publish_failed'");
  process.stdout.write(`${JSON.stringify({ target, scheduledArticles: Number(queueRows[0]?.total ?? 0),
    recordedRuns: Number(runRows[0]?.total ?? 0), recordedFailures: Number(failureRows[0]?.total ?? 0),
    databaseWrites: false, publicationAttempted: false, personalDataPrinted: false }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Publication queue inspection failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
