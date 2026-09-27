import "server-only";

import type { DemoStory } from "@/content/demo-home";
import { toIsoDate } from "@/features/publication/date-utils";
import { TOPIC_PAGE_SIZE } from "./model";

export async function getTopicArchive(slug: string, page: number) {
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") return null;
  const { createPublicationRepository } = await import("@/features/publication/repositories");
  const repository = createPublicationRepository();
  const topic = await repository.findPublicTopic(slug);
  if (!topic) return null;
  const rows = await repository.listPublishedByTopic(slug, { offset: (page - 1) * TOPIC_PAGE_SIZE, limit: TOPIC_PAGE_SIZE });
  const media = await repository.findPublicMediaByIds(rows.flatMap((row) => row.featuredMediaId ? [row.featuredMediaId] : []));
  const artwork = ["pitch", "strategy", "portrait", "tournament"] as const;
  const stories: DemoStory[] = rows.map((row, index) => ({ slug: row.slug, href: `/posts/${row.slug}`,
    category: topic.name, title: row.title, excerpt: row.excerpt ?? undefined,
    author: row.authorName ?? "Ακαδημίες Editorial", readingTime: "Άρθρο",
    artwork: artwork[index % artwork.length] ?? "pitch", imageAlt: row.title,
    imageUrl: media.find((item) => item.id === row.featuredMediaId)?.url,
    publishedAt: toIsoDate(row.publishedAt) }));
  return { topic, stories };
}
