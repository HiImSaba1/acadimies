import { toIsoDate } from "@/features/publication/date-utils";

type ArticleStructuredDataInput = {
  title: string;
  description: string | null;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date;
  authorName: string | null;
  authorUrl?: string | null;
  imageUrl?: string | null;
  canonicalUrl?: string | null;
  categoryName?: string | null;
  keywords?: string[];
};

export function buildArticleStructuredData(input: ArticleStructuredDataInput) {
  const safePostUrl = `https://acadimies.gr/posts/${input.slug}`;
  let url = safePostUrl;
  if (input.canonicalUrl) {
    try { url = new URL(input.canonicalUrl, "https://acadimies.gr").href; } catch { url = safePostUrl; }
  }
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    description: input.description || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: toIsoDate(input.publishedAt),
    dateModified: toIsoDate(input.updatedAt) ?? toIsoDate(input.publishedAt) ?? undefined,
    image: input.imageUrl ? [new URL(input.imageUrl, "https://acadimies.gr").href] : undefined,
    author: { "@type": "Person", name: input.authorName || "Ακαδημίες Editorial",
      ...(input.authorUrl ? { url: new URL(input.authorUrl, "https://acadimies.gr").href } : {}) },
    publisher: { "@type": "Organization", name: "Ακαδημίες", url: "https://acadimies.gr" },
    articleSection: input.categoryName || undefined,
    keywords: input.keywords?.length ? input.keywords : undefined,
    inLanguage: "el-GR",
  };
}

export function buildArticleBreadcrumbData(title: string, slug: string) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Αρχική", item: "https://acadimies.gr" },
      { "@type": "ListItem", position: 2, name: title, item: `https://acadimies.gr/posts/${slug}` },
    ],
  };
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
