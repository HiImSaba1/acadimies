import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { ArticleDispatcher } from "@/components/article-templates/ArticleDispatcher";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { articleDocumentSchema } from "@/features/articles/document";
import { buildArticleMetadata } from "@/features/articles/seo-metadata";
import { buildArticleBreadcrumbData, buildArticleStructuredData, safeJsonLd } from "@/features/articles/structured-data";
import { createPublicationRepository } from "@/features/publication/repositories";
import { getCachedPublishedPost, getCachedPublishedRedirect } from "@/features/publication/cached-data";
import { ArticlePostFooter } from "@/components/editorial/ArticlePostFooter";
import { toDate } from "@/features/publication/date-utils";
import { PostViewTracker } from "@/components/analytics/PostViewTracker";
import { publicAuthorUrl } from "@/features/authors/catalog";

type PostPageProps = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = createPublicationRepository();
  const demo = slug.startsWith("demo-27o-golden-cup-2027-");
  const post = await getCachedPublishedPost(slug) ?? (demo ? await repository.findGoldenCupDemoBySlug(slug) : null);
  if (!post) return {};
  const [featured] = post.featuredMediaId ? await repository.findPublicMediaByIds([post.featuredMediaId]) : [];
  const metadata = buildArticleMetadata(post, featured);
  return demo ? { ...metadata, robots: { index: false, follow: false } } : metadata;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const repository = createPublicationRepository();
  const demo = slug.startsWith("demo-27o-golden-cup-2027-");
  const post = await getCachedPublishedPost(slug) ?? (demo ? await repository.findGoldenCupDemoBySlug(slug) : null);
  if (!post) {
    const destination = demo ? null : await getCachedPublishedRedirect(slug);
    if (destination && destination.slug !== slug) permanentRedirect(`/posts/${destination.slug}`);
    notFound();
  }
  const document = articleDocumentSchema.safeParse(post.contentDocument);
  if (!document.success) notFound();
  const mediaIds = [...new Set([post.featuredMediaId, post.secondaryMediaId, ...document.data.blocks.flatMap((block) => block.type === "image" || block.type === "chapter" ? [block.mediaId] : [])].filter((id): id is string => Boolean(id)))];
  const [media, category, topics] = await Promise.all([repository.findPublicMediaByIds(mediaIds), repository.findArticleCategory(post.id), repository.findArticleTags(post.id)]);
  const featured = media.find((item) => item.id === post.featuredMediaId);
  const articleJsonLd = buildArticleStructuredData({ title: post.title, description: post.seoDescription ?? post.excerpt,
    slug: post.slug, publishedAt: post.publishedAt, updatedAt: post.updatedAt,
    authorName: post.authorName, authorUrl: publicAuthorUrl(post.authorUsername), imageUrl: featured?.url, canonicalUrl: post.canonicalUrl,
    categoryName: category?.name, keywords: topics.map((topic) => topic.name) });
  const publishedAt = toDate(post.publishedAt);
  if (!publishedAt && !demo) notFound();
  const context = publishedAt ? await repository.findPublishedArticleContext(post.id, publishedAt)
    : { ...await repository.findGoldenCupDemoContext(post.id),
      related: await repository.listRelatedPublished(post.id, { limit: 5, keyword: "Golden Cup" }) };
  const relatedMedia = await repository.findPublicMediaByIds(context.related
    .map((story) => story.featuredMediaId).filter((id): id is string => Boolean(id)));
  const relatedStories = context.related.map((story) => ({ slug: story.slug, title: story.title, excerpt: story.excerpt,
    author: story.authorName, publishedLabel: toDate(story.publishedAt)?.toLocaleDateString("el-GR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) ?? null,
    image: relatedMedia.find((item) => item.id === story.featuredMediaId) }));
  return <PageEntrance><HeaderPreview onLight /><main id="main-content" className="public-article-page">
    {demo ? null : <PostViewTracker slug={post.slug} />}
    {demo ? null : <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(buildArticleBreadcrumbData(post.title, post.slug)) }} />
    <ArticleDispatcher templateKey={post.articleTemplate ?? "longform"} title={post.title} category={category?.name ?? "Ακαδημίες"} author={post.authorName ?? "Ακαδημίες Editorial"} authorHref={publicAuthorUrl(post.authorUsername)} topics={topics} document={document.data} featuredImage={featured} secondaryImage={media.find((item) => item.id === post.secondaryMediaId)} media={media} relatedStories={relatedStories} />
    <ArticlePostFooter previous={context.previous} next={context.next} related={context.related} />
  </main><PublicationFooter year={new Date().getUTCFullYear()} /></PageEntrance>;
}
