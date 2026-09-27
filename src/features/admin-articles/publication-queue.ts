import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { auditEvents, posts, users } from "@/db/schema";
import { db, pool } from "@/db";
import { parseArticleRevisionSnapshot } from "./contracts";
import { publicationQueueState } from "./publication-queue-model";

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function getPublicationQueueOverview(now = new Date()) {
  const articles = await db.select({ id: posts.id, slug: posts.slug, title: posts.title,
    scheduledFor: posts.scheduledFor, updatedAt: posts.updatedAt, authorName: users.displayName }).from(posts)
    .leftJoin(users, eq(posts.authorId, users.id)).where(eq(posts.status, "scheduled"))
    .orderBy(posts.scheduledFor, posts.id).limit(100);
  const failedRows = articles.length ? await db.select({ articleId: auditEvents.entityId, createdAt: auditEvents.createdAt })
    .from(auditEvents).where(and(eq(auditEvents.action, "article.scheduled_publish_failed"),
      inArray(auditEvents.entityId, articles.map((article) => article.id))))
    .orderBy(desc(auditEvents.createdAt)).limit(200) : [];
  const latestFailure = new Map<string, Date>();
  for (const row of failedRows) if (!latestFailure.has(row.articleId)) latestFailure.set(row.articleId, row.createdAt);
  const runRows = await db.select({ createdAt: auditEvents.createdAt, metadata: auditEvents.metadata })
    .from(auditEvents).where(eq(auditEvents.action, "article.scheduler_run"))
    .orderBy(desc(auditEvents.createdAt)).limit(10);
  return {
    articles: articles.map((article) => ({ ...article, state: publicationQueueState({
      scheduledFor: article.scheduledFor, updatedAt: article.updatedAt,
      lastFailureAt: latestFailure.get(article.id), now,
    }) })),
    runs: runRows.map((run) => ({ createdAt: run.createdAt, checked: count(run.metadata.checked),
      published: count(run.metadata.published), failed: count(run.metadata.failed) })),
  };
}

export async function cancelScheduledPublication(articleId: string, actorId: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [postRows] = await connection.query<RowDataPacket[]>("SELECT * FROM posts WHERE id = ? AND status = 'scheduled' FOR UPDATE", [articleId]);
    const post = postRows[0];
    if (!post) { await connection.rollback(); return null; }
    const [categoryRows] = await connection.query<RowDataPacket[]>(`SELECT pc.category_id, c.slug
      FROM post_categories pc INNER JOIN categories c ON c.id = pc.category_id
      WHERE pc.post_id = ? ORDER BY pc.position ASC`, [articleId]);
    const [tagRows] = await connection.query<RowDataPacket[]>("SELECT tag_id FROM post_tags WHERE post_id = ?", [articleId]);
    const contentDocument = typeof post.content_document === "string" ? JSON.parse(post.content_document) : post.content_document;
    const snapshot = parseArticleRevisionSnapshot({ title: post.title, slug: post.slug, excerpt: post.excerpt ?? "",
      status: "draft", scheduledFor: null, headerTemplate: post.header_template,
      articleTemplate: post.article_template ?? "longform", categoryId: categoryRows[0]?.category_id ?? null,
      featuredMediaId: post.featured_media_id, secondaryMediaId: post.secondary_media_id,
      seoTitle: post.seo_title ?? "", seoDescription: post.seo_description ?? "",
      tagIds: tagRows.map((row) => String(row.tag_id)), newTagNames: [], contentDocument });
    if (!snapshot.success) throw new Error("Invalid scheduled article snapshot.");
    const [revisionRows] = await connection.query<RowDataPacket[]>("SELECT COALESCE(MAX(revision_number), 0) AS latest FROM post_revisions WHERE post_id = ?", [articleId]);
    const [updated] = await connection.query<ResultSetHeader>(`UPDATE posts
      SET status = 'draft', scheduled_for = NULL, updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND status = 'scheduled'`, [articleId]);
    if (updated.affectedRows !== 1) { await connection.rollback(); return null; }
    await connection.query(`INSERT INTO post_revisions
      (id, post_id, editor_id, revision_number, snapshot, change_summary) VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), articleId, actorId, Number(revisionRows[0]?.latest ?? 0) + 1,
        JSON.stringify(snapshot.data), "Scheduled publication cancelled"]);
    await connection.query(`INSERT INTO audit_events
      (id, actor_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, 'post', ?, ?)`,
      [randomUUID(), actorId, "article.schedule_cancelled", articleId, JSON.stringify({ previousStatus: "scheduled", nextStatus: "draft" })]);
    await connection.commit();
    return { slug: String(post.slug), categorySlugs: categoryRows.map((row) => String(row.slug)) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
