import { getCachedSyndicationPosts } from "@/features/publication/cached-data";
import { buildNewsSitemap, recentNewsStories } from "@/features/publication/syndication";

export const revalidate = 300;

export async function GET() {
  const stories = process.env.PUBLICATION_DATA_SOURCE === "database"
    ? await getCachedSyndicationPosts({ limit: 1000 }) : [];
  return new Response(buildNewsSitemap(recentNewsStories(stories)), { headers: {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
  } });
}
