const origin = "https://acadimies.gr";

export type SyndicationStory = {
  slug: string;
  title: string;
  excerpt: string | null;
  seoDescription: string | null;
  publishedAt: Date | string;
  updatedAt: Date | string;
  authorName: string | null;
  categoryName: string | null;
  imageUrl: string;
  mimeType: string;
};

function syndicationDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function escapeXml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function articleUrl(story: SyndicationStory) {
  return `${origin}/posts/${encodeURIComponent(story.slug)}`;
}

function absoluteImageUrl(url: string) {
  return new URL(url, origin).href;
}

export function buildRssFeed(stories: SyndicationStory[], generatedAt = new Date()): string {
  const items = stories.flatMap((story) => {
    const publishedAt = syndicationDate(story.publishedAt);
    if (!publishedAt) return [];
    return [`<item>
<title>${escapeXml(story.title)}</title>
<link>${articleUrl(story)}</link>
<guid isPermaLink="true">${articleUrl(story)}</guid>
<description>${escapeXml(story.seoDescription || story.excerpt || story.title)}</description>
<pubDate>${publishedAt.toUTCString()}</pubDate>
<dc:creator>${escapeXml(story.authorName || "Ακαδημίες Editorial")}</dc:creator>
${story.categoryName ? `<category>${escapeXml(story.categoryName)}</category>` : ""}
<enclosure url="${escapeXml(absoluteImageUrl(story.imageUrl))}" type="${escapeXml(story.mimeType)}" length="0" />
</item>`];
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>Ακαδημίες</title>
<link>${origin}</link>
<atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
<description>Νέα και άρθρα για τις ακαδημίες ποδοσφαίρου.</description>
<language>el-GR</language>
<lastBuildDate>${generatedAt.toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;
}

export function recentNewsStories(stories: SyndicationStory[], now = new Date()): SyndicationStory[] {
  const earliest = now.getTime() - 48 * 60 * 60 * 1000;
  return stories.filter((story) => {
    const publishedAt = syndicationDate(story.publishedAt);
    return publishedAt !== null && publishedAt.getTime() >= earliest && publishedAt <= now;
  }).slice(0, 1000);
}

export function buildNewsSitemap(stories: SyndicationStory[]): string {
  const urls = stories.flatMap((story) => {
    const publishedAt = syndicationDate(story.publishedAt);
    if (!publishedAt) return [];
    return [`<url>
<loc>${articleUrl(story)}</loc>
<news:news>
<news:publication><news:name>Ακαδημίες</news:name><news:language>el</news:language></news:publication>
<news:publication_date>${publishedAt.toISOString()}</news:publication_date>
<news:title>${escapeXml(story.title)}</news:title>
</news:news>
<image:image><image:loc>${escapeXml(absoluteImageUrl(story.imageUrl))}</image:loc></image:image>
</url>`];
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}
