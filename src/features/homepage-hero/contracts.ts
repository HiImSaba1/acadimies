import type { ArtworkVariant } from "@/components/editorial/EditorialArtwork";

export type HeroStory = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readingTime: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  artwork: ArtworkVariant;
  publishedAt?: string | null;
  previewDate?: string;
};

export function selectLatestHeroStories<T extends { id: string; publishedAt: Date | null }>(
  stories: T[],
): T[] {
  return [...stories]
    .filter((story) => story.publishedAt !== null)
    .sort((left, right) => {
      const byDate = right.publishedAt!.getTime() - left.publishedAt!.getTime();
      return byDate || right.id.localeCompare(left.id);
    })
    .slice(0, 5);
}
