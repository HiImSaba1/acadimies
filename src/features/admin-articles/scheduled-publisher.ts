import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { pool } from "@/db";
import { parseArticleRevisionSnapshot } from "./contracts";
import { scheduledPublicationLimit } from "./scheduler-auth";

export type ScheduledPublication = {
  id: string;
  slug: string;
  categorySlugs: string[];
  scheduledFor: Date;
};

export type ScheduledPublicationBatch = {
  checked: number;
  published: ScheduledPublication[];
  failed: number;
};

type DueRow = RowDataPacket & { id: string; scheduled_for: Date | string };

async function recordSchedulerAudit(action: string, entityType: "post" | "scheduler", entityId: string, metadata: Record<string, unknown>) {
  try {
    await pool.query(`INSERT INTO audit_events
      (id, actor_id, action, entity_type, entity_id, metadata) VALUES (?, NULL, ?, ?, ?, ?)`,
      [randomUUID(), action, entityType, entityId, JSON.stringify(metadata)]);
    return true;
  } catch {
    return false;
  }
}

export async function listDueScheduledPublications(now: Date, limit: number) {
  const [rows] = await pool.query<DueRow[]>(`SELECT id, scheduled_for FROM posts
    WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ?
    ORDER BY scheduled_for ASC, id ASC LIMIT ?`, [now, Math.min(Math.max(limit, 1), 100)]);
  return rows.map((row) => ({ id: String(row.id), scheduledFor: row.scheduled_for instanceof Date
    ? row.scheduled_for : new Date(row.scheduled_for) }));
}

async function publishOne(connection: PoolConnection, id: string, now: Date): Promise<ScheduledPublication | null> {
  await connection.beginTransaction();
  try {
    const [postRows] = await connection.query<RowDataPacket[]>(`SELECT * FROM posts
      WHERE id = ? AND status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ? FOR UPDATE`, [id, now]);
    const post = postRows[0];
    if (!post) {
      await connection.rollback();
      return null;
    }
    const [categoryRows] = await connection.query<RowDataPacket[]>(`SELECT pc.category_id, c.slug
      FROM post_categories pc INNER JOIN categories c ON c.id = pc.category_id
      WHERE pc.post_id = ? ORDER BY pc.position ASC`, [id]);
    const [tagRows] = await connection.query<RowDataPacket[]>("SELECT tag_id FROM post_tags WHERE post_id = ?", [id]);
    const contentDocument = typeof post.content_document === "string" ? JSON.parse(post.content_document) : post.content_document;
    const snapshot = parseArticleRevisionSnapshot({ title: post.title, slug: post.slug, excerpt: post.excerpt ?? "",
      status: "published", scheduledFor: null, headerTemplate: post.header_template,
      articleTemplate: post.article_template ?? "longform", categoryId: categoryRows[0]?.category_id ?? null,
      featuredMediaId: post.featured_media_id, secondaryMediaId: post.secondary_media_id,
      seoTitle: post.seo_title ?? "", seoDescription: post.seo_description ?? "",
      tagIds: tagRows.map((row) => String(row.tag_id)), newTagNames: [], contentDocument });
    if (!snapshot.success) throw new Error(`Scheduled article ${id} has an invalid revision snapshot.`);
    const [revisionRows] = await connection.query<RowDataPacket[]>("SELECT COALESCE(MAX(revision_number), 0) AS latest FROM post_revisions WHERE post_id = ?", [id]);
    const revisionNumber = Number(revisionRows[0]?.latest ?? 0) + 1;
    const scheduledFor = post.scheduled_for instanceof Date ? post.scheduled_for : new Date(post.scheduled_for);
    if (Number.isNaN(scheduledFor.getTime())) throw new Error(`Scheduled article ${id} has an invalid publication time.`);
    const [updated] = await connection.query<ResultSetHeader>(`UPDATE posts
      SET status = 'published', published_at = ?, scheduled_for = NULL, updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ?`, [scheduledFor, id, now]);
    if (updated.affectedRows !== 1) {
      await connection.rollback();
      return null;
    }
    await connection.query(`INSERT INTO post_revisions
      (id, post_id, editor_id, revision_number, snapshot, change_summary) VALUES (?, ?, NULL, ?, ?, ?)`,
      [randomUUID(), id, revisionNumber, JSON.stringify(snapshot.data), "Published automatically from schedule"]);
    await connection.query(`INSERT INTO audit_events
      (id, actor_id, action, entity_type, entity_id, metadata) VALUES (?, NULL, ?, 'post', ?, ?)`,
      [randomUUID(), "article.scheduled_published", id, JSON.stringify({ slug: post.slug,
        scheduledFor: scheduledFor.toISOString(), publishedAt: scheduledFor.toISOString() })]);
    await connection.commit();
    return { id, slug: String(post.slug), categorySlugs: categoryRows.map((row) => String(row.slug)), scheduledFor };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export async function publishDueScheduledPublications(
  now = new Date(),
  limit = scheduledPublicationLimit(process.env.ACADIMIES_SCHEDULED_PUBLISH_LIMIT),
): Promise<ScheduledPublicationBatch> {
  const due = await listDueScheduledPublications(now, limit);
  const published: ScheduledPublication[] = [];
  let failed = 0;
  for (const candidate of due) {
    const connection = await pool.getConnection();
    try {
      const result = await publishOne(connection, candidate.id, now);
      if (result) published.push(result);
    } catch {
      failed += 1;
      await recordSchedulerAudit("article.scheduled_publish_failed", "post", candidate.id,
        { reason: "validation-or-database-error", attemptedAt: now.toISOString() });
    } finally {
      connection.release();
    }
  }
  await recordSchedulerAudit("article.scheduler_run", "scheduler", randomUUID(), { checked: due.length,
    published: published.length, failed, checkedAt: now.toISOString() });
  return { checked: due.length, published, failed };
}
