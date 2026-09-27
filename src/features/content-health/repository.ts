import "server-only";

import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { postCategories, posts } from "@/db/schema";
import { articleHealthIssues, contentHealthIssueKeys, type ContentHealthIssue } from "./model";

export async function getContentHealthOverview() {
  const { db } = await import("@/db");
  const now = new Date();
  const rows = await db.select({
    id: posts.id,
    slug: posts.slug,
    title: posts.title,
    publishedAt: posts.publishedAt,
    authorId: posts.authorId,
    featuredMediaId: posts.featuredMediaId,
    excerpt: posts.excerpt,
    seoTitle: posts.seoTitle,
    seoDescription: posts.seoDescription,
    categoryCount: sql<number>`count(distinct ${postCategories.categoryId})`,
  }).from(posts)
    .leftJoin(postCategories, eq(postCategories.postId, posts.id))
    .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt), lte(posts.publishedAt, now)))
    .groupBy(posts.id)
    .orderBy(desc(posts.publishedAt), desc(posts.id));

  const totals = Object.fromEntries(contentHealthIssueKeys.map((key) => [key, 0])) as Record<ContentHealthIssue, number>;
  const assessed = rows.map((row) => {
    const issues = articleHealthIssues({ ...row, categoryCount: Number(row.categoryCount) });
    for (const issue of issues) totals[issue] += 1;
    return { id: row.id, slug: row.slug, title: row.title, publishedAt: row.publishedAt, issues };
  });

  return {
    published: assessed.length,
    healthy: assessed.filter((article) => article.issues.length === 0).length,
    totals,
    articles: assessed.filter((article) => article.issues.length > 0).slice(0, 100),
    truncated: assessed.filter((article) => article.issues.length > 0).length > 100,
  };
}
