import { describe, expect, it } from "vitest";
import { buildArticleMetadata } from "./seo-metadata";

const post = { title: "Ακαδημίες ποδοσφαίρου", slug: "akadimies-podosfairou", excerpt: "Νέα για παιδιά.",
  seoTitle: null, seoDescription: null, canonicalUrl: null };

describe("article SEO metadata", () => {
  it("falls back to editorial title/excerpt and the stable post URL", () => {
    const metadata = buildArticleMetadata(post);
    expect(metadata.title).toBe(post.title);
    expect(metadata.description).toBe(post.excerpt);
    expect(metadata.alternates?.canonical).toBe("/posts/akadimies-podosfairou");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/posts/akadimies-podosfairou",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  });

  it("publishes persisted article dates and author attribution", () => {
    const publishedAt = new Date("2026-09-15T08:30:00.000Z");
    const metadata = buildArticleMetadata({ ...post, publishedAt, authorName: "Συντακτική ομάδα" });
    expect(metadata.openGraph).toMatchObject({
      publishedTime: publishedAt.toISOString(),
      authors: ["Συντακτική ομάδα"],
    });
  });

  it("uses persisted SEO overrides and a safe cover for social cards", () => {
    const metadata = buildArticleMetadata({ ...post, seoTitle: "SEO τίτλος", seoDescription: "SEO κείμενο" },
      { url: "/webp/cover.webp", alt: "Προπόνηση παιδιών" });
    expect(metadata.title).toBe("SEO τίτλος");
    expect(metadata.description).toBe("SEO κείμενο");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.openGraph?.images).toEqual([{ url: "/webp/cover.webp", alt: "Προπόνηση παιδιών" }]);
    expect(buildArticleMetadata(post, { url: "javascript:bad", alt: "" }).twitter).toMatchObject({ card: "summary" });
  });
});
