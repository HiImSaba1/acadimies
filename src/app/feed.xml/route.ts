import { getCachedSyndicationPosts } from "@/features/publication/cached-data";
import { buildRssFeed } from "@/features/publication/syndication";

export const revalidate = 300;

export async function GET() {
  const stories = process.env.PUBLICATION_DATA_SOURCE === "database"
    ? await getCachedSyndicationPosts({ limit: 50 }) : [];
  return new Response(buildRssFeed(stories), { headers: {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
  } });
}
