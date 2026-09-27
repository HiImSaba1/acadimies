import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";

type SummaryRow = RowDataPacket & { public_topics: number; linked_posts: number; empty_or_private_topics: number };

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Public topic inspection is restricted to next_acadimies.");
  const [rows] = await pool.query<SummaryRow[]>(`SELECT
    COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN t.id END) AS public_topics,
    COUNT(DISTINCT p.id) AS linked_posts,
    COUNT(DISTINCT CASE WHEN p.id IS NULL THEN t.id END) AS empty_or_private_topics
    FROM tags t LEFT JOIN post_tags pt ON pt.tag_id = t.id
    LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
      AND p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP(3) AND p.slug NOT LIKE 'demo-%'`);
  const row = rows[0];
  process.stdout.write(`${JSON.stringify({ target, publicTopics: Number(row?.public_topics ?? 0),
    linkedPublishedPosts: Number(row?.linked_posts ?? 0), emptyOrPrivateTopics: Number(row?.empty_or_private_topics ?? 0),
    pageSize: 12, databaseWrites: false, articleDataPrinted: false }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Public topic inspection failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
