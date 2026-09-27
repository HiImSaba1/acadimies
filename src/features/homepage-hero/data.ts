import "server-only";

import type { HeroStory } from "./contracts";
import { homeSections, leadStory, voicesFeature } from "@/content/demo-home";
import { safePublicMediaUrl } from "@/features/admin-articles/media-contracts";
import { toIsoDate } from "@/features/publication/date-utils";
import { isExcludedImportedTitle } from "@/features/publication/excluded-imported-content";

const previewStories: HeroStory[] = [
  {
    id: "preview-lead", slug: "to-gipedo-opou-megalonoun", title: leadStory.title,
    excerpt: leadStory.excerpt, category: leadStory.category, author: leadStory.author,
    readingTime: leadStory.readingTime, href: "/article-preview?template=longform",
    imageUrl: null, imageAlt: "Αθλητές ακαδημιών σε προπόνηση", artwork: "pitch",
    previewDate: "2026-06-11T12:00:00.000Z",
  },
  ...homeSections.latest.slice(0, 3).map((story, index): HeroStory => ({
    id: `preview-latest-${index}`, slug: story.slug, title: story.title,
    excerpt: story.excerpt ?? "Νέα, άνθρωποι και ιδέες από το ποδόσφαιρο ανάπτυξης.",
    category: story.category, author: story.author, readingTime: story.readingTime,
    href: "/article-preview?template=longform", imageUrl: null,
    imageAlt: story.imageAlt, artwork: story.artwork, previewDate: story.previewDate,
  })),
  ...homeSections.development.slice(0, 2).map((story, index): HeroStory => ({
    id: `preview-development-${index}`, slug: story.slug, title: story.title,
    excerpt: story.excerpt ?? "Νέα, άνθρωποι και ιδέες από το ποδόσφαιρο ανάπτυξης.",
    category: story.category, author: story.author, readingTime: story.readingTime,
    href: "/article-preview?template=longform", imageUrl: null,
    imageAlt: story.imageAlt, artwork: story.artwork, previewDate: story.previewDate,
  })),
  {
    id: "preview-parent", slug: "goneis-kai-paidia", category: "Γονείς & παιδιά",
    title: "Η συμπεριφορά που βοηθά ένα παιδί να αγαπήσει το ποδόσφαιρο",
    excerpt: "Πώς η υποστήριξη από την κερκίδα επηρεάζει τη χαρά, την αυτοπεποίθηση και την εξέλιξη.",
    author: "Ακαδημίες Editorial", readingTime: "7 λεπτά",
    href: "/article-preview?template=longform", imageUrl: null,
    imageAlt: "Γονέας και παιδί συζητούν μετά την προπόνηση", artwork: "portrait",
    previewDate: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "preview-voices", slug: voicesFeature.slug, category: voicesFeature.category,
    title: voicesFeature.title, excerpt: voicesFeature.excerpt ?? "Πρόσωπα και ιδέες από το ποδόσφαιρο ανάπτυξης.",
    author: voicesFeature.author, readingTime: voicesFeature.readingTime,
    href: "/article-preview?template=interview", imageUrl: null,
    imageAlt: voicesFeature.imageAlt, artwork: voicesFeature.artwork, previewDate: voicesFeature.previewDate,
  },
];

export async function getHomepageHeroStories(): Promise<HeroStory[]> {
  if (process.env.PUBLICATION_DATA_SOURCE !== "database") {
    return previewStories.slice(0, 6).filter((_, index) => index !== 3).slice(0, 5);
  }

  const { getCachedHomepageHeroPosts } = await import("@/features/publication/cached-data");
  const rows = await getCachedHomepageHeroPosts();
  // Keep the hero contract deterministic even if a cache or alternate
  // repository implementation returns more records than requested.
  return rows.filter((row) => !isExcludedImportedTitle(row.title)).slice(0, 5).map((row): HeroStory => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    category: "Νέα ακαδημιών",
    author: row.authorName ?? "Ακαδημίες Editorial",
    readingTime: "Άρθρο",
    href: `/posts/${row.slug}`,
    imageUrl: safePublicMediaUrl(row.imageUrl),
    imageAlt: row.imageAlt ?? row.title,
    artwork: "pitch",
    publishedAt: toIsoDate(row.publishedAt),
  }));
}
