import "dotenv/config";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../src/db";

const apply = process.env.ACADIMIES_SPAM_POSTS_APPLY === "1";
const targets = [
  { label: "Find your style Favorites...", match: "prefix", value: "Find your style Favorites" },
  { label: "Where to find the hottest gentle...", match: "prefix", value: "Where to find the hottest gentle" },
  { label: "Home", match: "exact", value: "Home" },
  { label: "Home - mobile", match: "exact", value: "Home - mobile" },
] as const;

type PostRow = RowDataPacket & { id: string; title: string; slug: string; legacy_wordpress_id: number | null };

function normalizeTitle(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Spam cleanup is restricted to next_acadimies.");
  const [candidateRows] = await pool.query<PostRow[]>(
    "SELECT id, title, slug, legacy_wordpress_id FROM posts WHERE title LIKE ? OR title LIKE ? OR title LIKE ? OR slug LIKE ? ORDER BY title",
    [`${targets[0].value}%`, `${targets[1].value}%`, `%${targets[2].value}%`, "home%"],
  );
  const matchedTargets = targets.map((approvedTarget) => ({
    ...approvedTarget,
    matches: candidateRows.filter((row) => {
      const title = normalizeTitle(row.title);
      const value = normalizeTitle(approvedTarget.value);
      return approvedTarget.match === "exact" ? title === value : title.startsWith(value);
    }),
  }));
  if (matchedTargets.some(({ matches }) => matches.length > 1)) {
    throw new Error("An approved cleanup title matched more than one post. No changes were made.");
  }
  const rows = matchedTargets.flatMap(({ matches }) => matches);
  const selectedIds = new Set(rows.map(({ id }) => id));
  const rejectedCandidates = candidateRows.filter(({ id }) => !selectedIds.has(id));
  const [analyticsRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'post_daily_views'");
  const analyticsReady = Number(analyticsRows[0]?.total ?? 0) === 1;
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", target, approvedTargets: matchedTargets.map(({ label, matches }) => ({
      title: label, status: matches.length === 1 ? "matched" : "already-absent" })), matches: rows.map((row) => ({
      id: row.id, title: row.title, slug: row.slug, legacyWordPressId: row.legacy_wordpress_id })),
      rejectedCandidates: rejectedCandidates.map((row) => ({ id: row.id, title: row.title, slug: row.slug })),
      databaseWrites: false, mediaFilesDeleted: false }, null, 2)}\n`);
    return;
  }
  if (!rows.length) {
    process.stdout.write(`${JSON.stringify({ mode: "applied", target, deletedPosts: [],
      alreadyAbsent: targets.map(({ label }) => label), databaseWrites: false, mediaFilesDeleted: false }, null, 2)}\n`);
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const ids = rows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    if (analyticsReady) await connection.query(`DELETE FROM post_daily_views WHERE post_id IN (${placeholders})`, ids);
    await connection.query(`DELETE FROM post_tags WHERE post_id IN (${placeholders})`, ids);
    await connection.query(`DELETE FROM post_categories WHERE post_id IN (${placeholders})`, ids);
    await connection.query(`DELETE FROM post_revisions WHERE post_id IN (${placeholders})`, ids);
    await connection.query(`UPDATE legacy_import_records SET promoted_post_id = NULL, state = 'excluded', updated_at = CURRENT_TIMESTAMP(3) WHERE promoted_post_id IN (${placeholders})`, ids);
    const [result] = await connection.query<ResultSetHeader>(`DELETE FROM posts WHERE id IN (${placeholders})`, ids);
    const affectedRows = Number(result.affectedRows);
    if (affectedRows !== rows.length) throw new Error(`Expected to delete ${rows.length} posts; deleted ${affectedRows}.`);
    await connection.commit();
    process.stdout.write(`${JSON.stringify({ mode: "applied", target, deletedPosts: rows.map((row) => ({ id: row.id, title: row.title })),
      alreadyAbsent: matchedTargets.filter(({ matches }) => matches.length === 0).map(({ label }) => label),
      ledgerState: "excluded", databaseWrites: true, mediaFilesDeleted: false }, null, 2)}\n`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Spam cleanup failed."}\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
