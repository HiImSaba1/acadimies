import "server-only";

import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { postDailyViews, posts } from "@/db/schema";

export async function getReadershipOverview(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 29);
  const sinceDate = since.toISOString().slice(0, 10);
  const [summary] = await db.select({
    lastThirtyDays: sql<number>`coalesce(sum(${postDailyViews.views}), 0)`,
    today: sql<number>`coalesce(sum(case when ${postDailyViews.viewDate} = ${today} then ${postDailyViews.views} else 0 end), 0)`,
  }).from(postDailyViews).where(gte(postDailyViews.viewDate, sinceDate));
  const topPosts = await db.select({ title: posts.title, slug: posts.slug,
    views: sql<number>`sum(${postDailyViews.views})`.as("views") })
    .from(postDailyViews).innerJoin(posts, eq(posts.id, postDailyViews.postId))
    .where(gte(postDailyViews.viewDate, sinceDate)).groupBy(posts.id, posts.title, posts.slug)
    .orderBy(desc(sql<number>`sum(${postDailyViews.views})`)).limit(10);
  return { today: Number(summary?.today ?? 0), lastThirtyDays: Number(summary?.lastThirtyDays ?? 0),
    topPosts: topPosts.map((post) => ({ ...post, views: Number(post.views) })) };
}
