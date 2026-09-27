import type { MetadataRoute } from "next";
import { categoryPages } from "@/features/category-pages/catalog";
import { safePublicMediaUrl } from "@/features/admin-articles/media-contracts";

const origin = "https://acadimies.gr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/dora-ioakeimidou`, changeFrequency: "monthly", priority: .5 },
    ...categoryPages.map((category) => ({ url: `${origin}/category/${category.slug}`,
      changeFrequency: "daily" as const, priority: .8 })),
  ];
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") return entries;
  const { createPublicationRepository } = await import("@/features/publication/repositories");
  const repository = createPublicationRepository();
  const [posts, topics] = await Promise.all([repository.listPublishedForSitemap(), repository.listPublicTopicsForSitemap()]);
  return [...entries, ...topics.map((topic) => ({ url: `${origin}/topic/${topic.slug}`,
    lastModified: topic.updatedAt, changeFrequency: "weekly" as const, priority: .6 })), ...posts.map((post) => {
    const image = safePublicMediaUrl(post.imageUrl);
    return { url: `${origin}/posts/${post.slug}`, lastModified: post.updatedAt,
      changeFrequency: "weekly" as const, priority: .7,
      images: image ? [new URL(image, origin).href] : undefined };
  })];
}
