import "server-only";

import { unstable_cache } from "next/cache";
import { categoryPages } from "@/features/category-pages/catalog";
import { publicationCacheTags } from "@/features/publication/cache-tags";

export async function getHeaderMenuPostImages(): Promise<Record<string, string>> {
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") return {};
  return unstable_cache(async () => {
    const { createPublicationRepository } = await import("@/features/publication/repositories");
    const repository = createPublicationRepository();
    const latestByCategory = await Promise.all(categoryPages.map(async (category) => ({
      slug: category.slug,
      post: (await repository.listPublishedByCategory(category.legacySlug, { limit: 1, sort: "recent" }))[0] ?? null,
    })));
    const mediaIds = latestByCategory.flatMap(({ post }) => post?.featuredMediaId ? [post.featuredMediaId] : []);
    const media = await repository.findPublicMediaByIds([...new Set(mediaIds)]);
    return Object.fromEntries(latestByCategory.flatMap(({ slug, post }) => {
      const image = post?.featuredMediaId ? media.find((item) => item.id === post.featuredMediaId) : null;
      return image ? [[slug, image.url]] : [];
    }));
  }, ["header-menu-post-images-v1"], {
    revalidate: 300,
    tags: [publicationCacheTags.all, publicationCacheTags.latest],
  })();
}
