import "dotenv/config";

import type { RowDataPacket } from "mysql2";
import { pool } from "../src/db";
import { publicAuthorProfiles } from "../src/features/authors/catalog";

type CountRow = RowDataPacket & { username: string; published_count: number };

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Public author inspection is restricted to next_acadimies.");
  const usernames = publicAuthorProfiles().map((profile) => profile.username);
  const placeholders = usernames.map(() => "?").join(",");
  const [counts] = await pool.query<CountRow[]>(`SELECT u.username, COUNT(p.id) AS published_count
    FROM users u LEFT JOIN posts p ON p.author_id = u.id AND p.status = 'published'
      AND p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP(3) AND p.slug NOT LIKE 'demo-%'
    WHERE u.is_active = true AND u.username IN (${placeholders}) GROUP BY u.username`, usernames);
  const found = new Map(counts.map((row) => [row.username, Number(row.published_count)]));
  const profiles = publicAuthorProfiles().map((profile) => ({ route: profile.route,
    identityExists: found.has(profile.username), publishedArticles: found.get(profile.username) ?? 0 }));
  process.stdout.write(`${JSON.stringify({ target, profiles, publicProfiles: profiles.length,
    databaseWrites: false, personalDataPrinted: false }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Public author inspection failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
