import "dotenv/config";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../src/db";
import { assessYoastStyleMetadata, buildMissingEditorialMetadata } from "../src/features/content-health/seo-repair";

const apply = process.env.ACADIMIES_CONTENT_REPAIR_APPLY === "1";
const authorUsername = "dora-ioakeimidou";
const authorDisplayName = "Δώρα Ιωακειμίδου";

type UserRow = RowDataPacket & { id: string; username: string; display_name: string };
type PostRow = RowDataPacket & {
  id: string;
  title: string;
  author_id: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  content_document: unknown;
  sanitized_legacy_html: string | null;
};

function parseDocument(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

async function main() {
  const [databaseRows] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const target = String(databaseRows[0]?.name ?? "");
  if (target !== "next_acadimies") throw new Error("Content repair is restricted to next_acadimies.");

  const [authorRows] = await pool.query<UserRow[]>(
    "SELECT id, username, display_name FROM users WHERE username = ? OR display_name = ? ORDER BY username = ? DESC LIMIT 1",
    [authorUsername, authorDisplayName, authorUsername],
  );
  const existingAuthor = authorRows[0] ?? null;
  const [posts] = await pool.query<PostRow[]>(`SELECT id, title, author_id, excerpt, seo_title,
    seo_description, content_document, sanitized_legacy_html FROM posts
    WHERE author_id IS NULL OR (status = 'published' AND published_at IS NOT NULL
      AND published_at <= CURRENT_TIMESTAMP(3) AND (excerpt IS NULL OR trim(excerpt) = ''
        OR seo_title IS NULL OR trim(seo_title) = '' OR seo_description IS NULL OR trim(seo_description) = ''))
    ORDER BY published_at DESC, id DESC`);

  const candidates = posts.map((post) => ({ post, generated: buildMissingEditorialMetadata({
    title: post.title, excerpt: post.excerpt, seoTitle: post.seo_title, seoDescription: post.seo_description,
    contentDocument: parseDocument(post.content_document), sanitizedLegacyHtml: post.sanitized_legacy_html,
  }) }));
  const generatedAssessments = candidates.filter(({ post }) => !post.seo_title?.trim() || !post.seo_description?.trim())
    .map(({ post, generated }) => assessYoastStyleMetadata(post.title, generated.seoTitle, generated.seoDescription));
  const summary = {
    missingAuthors: posts.filter((post) => !post.author_id).length,
    excerptsToGenerate: candidates.filter(({ post, generated }) => !post.excerpt?.trim() && Boolean(generated.excerpt)).length,
    seoTitlesToGenerate: candidates.filter(({ post, generated }) => !post.seo_title?.trim() && Boolean(generated.seoTitle)).length,
    seoDescriptionsToGenerate: candidates.filter(({ post, generated }) => !post.seo_description?.trim() && Boolean(generated.seoDescription)).length,
    skippedWithoutUsableText: candidates.filter(({ post, generated }) =>
      (!post.excerpt?.trim() && !generated.excerpt) || (!post.seo_description?.trim() && !generated.seoDescription)).length,
    deterministicYoastStylePasses: generatedAssessments.filter((assessment) => assessment.passesDeterministicChecks).length,
    deterministicYoastStyleNeedsReview: generatedAssessments.filter((assessment) => !assessment.passesDeterministicChecks).length,
  };

  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", target,
      author: { displayName: authorDisplayName, existing: Boolean(existingAuthor), willCreate: !existingAuthor },
      ...summary, databaseWrites: false, existingMetadataOverwritten: false, titlesPrinted: false }, null, 2)}\n`);
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let authorId = existingAuthor?.id ?? null;
    if (!authorId) {
      authorId = randomUUID();
      await connection.query(`INSERT INTO users (id, username, email, display_name, role, password_hash, is_active)
        VALUES (?, ?, NULL, ?, 'author', NULL, true)`, [authorId, authorUsername, authorDisplayName]);
    }
    let updatedPosts = 0;
    for (const { post, generated } of candidates) {
      const [result] = await connection.query<ResultSetHeader>(`UPDATE posts SET
        author_id = coalesce(author_id, ?), excerpt = CASE WHEN excerpt IS NULL OR trim(excerpt) = '' THEN ? ELSE excerpt END,
        seo_title = CASE WHEN seo_title IS NULL OR trim(seo_title) = '' THEN ? ELSE seo_title END,
        seo_description = CASE WHEN seo_description IS NULL OR trim(seo_description) = '' THEN ? ELSE seo_description END,
        updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [authorId, generated.excerpt, generated.seoTitle, generated.seoDescription, post.id]);
      updatedPosts += Number(result.affectedRows);
    }
    await connection.query(`INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, metadata)
      VALUES (?, NULL, 'content_health.bulk_repair', 'publication', ?, ?)`,
    [randomUUID(), authorId, JSON.stringify({ ...summary, existingMetadataOverwritten: false })]);
    await connection.commit();
    process.stdout.write(`${JSON.stringify({ mode: "applied", target, author: { id: authorId, displayName: authorDisplayName,
      created: !existingAuthor }, ...summary, updatedPosts, databaseWrites: true,
      existingMetadataOverwritten: false, titlesPrinted: false }, null, 2)}\n`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Content repair failed."} No secrets were printed.\n`);
  process.exitCode = 1;
}).finally(() => pool.end());
