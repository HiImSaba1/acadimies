import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";
import {
  listDueScheduledPublications,
  publishDueScheduledPublications,
} from "../src/features/admin-articles/scheduled-publisher";
import { scheduledPublicationLimit } from "../src/features/admin-articles/scheduler-auth";

const apply = process.env.ACADIMIES_SCHEDULED_PUBLISH_APPLY === "1";
const limit = scheduledPublicationLimit(process.env.ACADIMIES_SCHEDULED_PUBLISH_LIMIT);

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Scheduled publishing is restricted to next_acadimies.");
  const now = new Date();
  const due = await listDueScheduledPublications(now, limit);
  const result = apply ? await publishDueScheduledPublications(now, limit) : null;
  process.stdout.write(`${JSON.stringify({ mode: apply ? "bounded-apply" : "dry-run", target, checkedAt: now.toISOString(),
    limit, due: due.length, published: result?.published.length ?? 0, failed: result?.failed ?? 0,
    databaseWrites: apply,
    cacheRevalidation: false, emailsSent: false }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Scheduled publishing failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
