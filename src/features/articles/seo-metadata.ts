import type { Metadata } from "next";
import { toIsoDate } from "@/features/publication/date-utils";
import { safePublicMediaUrl } from "@/features/admin-articles/media-contracts";

type SeoPost = {
  title: string; slug: string; excerpt: string | null; seoTitle: string | null;
  seoDescription: string | null; canonicalUrl: string | null;
  publishedAt?: Date | null; authorName?: string | null;
};

export function buildArticleMetadata(post: SeoPost, image?: { url: string; alt: string }): Metadata {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;
  const imageUrl = image ? safePublicMediaUrl(image.url) : null;
  return {
    title, description,
    alternates: { canonical: post.canonicalUrl ?? `/posts/${post.slug}` },
    openGraph: { type: "article", title, description, url: post.canonicalUrl ?? `/posts/${post.slug}`,
      publishedTime: toIsoDate(post.publishedAt) ?? undefined, authors: post.authorName ? [post.authorName] : undefined,
      images: imageUrl ? [{ url: imageUrl, alt: image?.alt || post.title }] : undefined },
    twitter: { card: imageUrl ? "summary_large_image" : "summary", title, description,
      images: imageUrl ? [imageUrl] : undefined },
  };
}
