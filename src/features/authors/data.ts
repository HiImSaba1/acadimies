import "server-only";

import type { DemoStory } from "@/content/demo-home";
import { toIsoDate } from "@/features/publication/date-utils";
import { publicAuthorByUsername } from "./catalog";

export const AUTHOR_PAGE_SIZE = 12;

export function parseAuthorPage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function getPublicAuthorArchive(username: string, page: number) {
  const profile = publicAuthorByUsername(username);
  if (!profile) return null;
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") return { profile, stories: [] as DemoStory[], total: 0 };

  const { createPublicationRepository } = await import("@/features/publication/repositories");
  const repository = createPublicationRepository();
  const offset = (page - 1) * AUTHOR_PAGE_SIZE;
  const [rows, total] = await Promise.all([
    repository.listPublishedByAuthor(username, { offset, limit: AUTHOR_PAGE_SIZE }),
    repository.countPublishedByAuthor(username),
  ]);
  const media = await repository.findPublicMediaByIds(rows.flatMap((row) => row.featuredMediaId ? [row.featuredMediaId] : []));
  const artwork = ["pitch", "strategy", "portrait", "tournament"] as const;
  const stories: DemoStory[] = rows.map((row, index) => ({
    slug: row.slug,
    href: `/posts/${row.slug}`,
    category: "Άρθρο",
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    author: row.authorName ?? profile.displayName,
    readingTime: "Άρθρο",
    artwork: artwork[index % artwork.length] ?? "pitch",
    imageAlt: row.title,
    imageUrl: media.find((item) => item.id === row.featuredMediaId)?.url,
    publishedAt: toIsoDate(row.publishedAt),
  }));
  return { profile, stories, total };
}
