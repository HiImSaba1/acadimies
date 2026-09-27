import { describe, expect, it } from "vitest";
import { buildNewsSitemap, buildRssFeed, escapeXml, recentNewsStories, type SyndicationStory } from "./syndication";

const story = (publishedAt: string, title = "Νέα & εξέλιξη"): SyndicationStory => ({ slug: "nea-akadimion", title,
  excerpt: "Μια νέα ιστορία", seoDescription: null, publishedAt: new Date(publishedAt), updatedAt: new Date(publishedAt),
  authorName: "Δώρα Ιωακειμίδου", categoryName: "Νέα Ακαδημιών", imageUrl: "/images/2026/01/story.webp", mimeType: "image/webp" });

describe("editorial syndication XML", () => {
  it("escapes unsafe XML characters and publishes absolute URLs", () => {
    expect(escapeXml(`<tag a="1">A & B</tag>`)).toBe("&lt;tag a=&quot;1&quot;&gt;A &amp; B&lt;/tag&gt;");
    const rss = buildRssFeed([story("2026-09-19T08:00:00Z")], new Date("2026-09-19T09:00:00Z"));
    expect(rss).toContain("https://acadimies.gr/posts/nea-akadimion");
    expect(rss).toContain("https://acadimies.gr/images/2026/01/story.webp");
    expect(rss).toContain("Νέα &amp; εξέλιξη");
  });

  it("keeps only the latest 48 hours in the News sitemap", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    const recent = recentNewsStories([story("2026-09-19T08:00:00Z"), story("2026-09-16T08:00:00Z", "Παλιό")], now);
    expect(recent).toHaveLength(1);
    const xml = buildNewsSitemap(recent);
    expect(xml).toContain("xmlns:news");
    expect(xml).not.toContain("Παλιό");
  });

  it("accepts dates serialized by the Next cache", () => {
    const cachedStory = {
      ...story("2026-09-19T08:00:00Z"),
      publishedAt: "2026-09-19T08:00:00.000Z",
      updatedAt: "2026-09-19T08:30:00.000Z",
    } satisfies SyndicationStory;
    const now = new Date("2026-09-19T12:00:00Z");

    expect(buildRssFeed([cachedStory], now)).toContain("Sat, 19 Sep 2026 08:00:00 GMT");
    expect(buildNewsSitemap(recentNewsStories([cachedStory], now))).toContain("2026-09-19T08:00:00.000Z");
  });

  it("skips malformed publication dates without breaking the whole document", () => {
    const malformed = { ...story("2026-09-19T08:00:00Z"), publishedAt: "not-a-date" } satisfies SyndicationStory;

    expect(buildRssFeed([malformed])).not.toContain("<item>");
    expect(buildNewsSitemap([malformed])).not.toContain("<url>");
  });
});
