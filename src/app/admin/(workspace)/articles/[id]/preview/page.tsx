import { notFound } from "next/navigation";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { ArticleDispatcher } from "@/components/article-templates/ArticleDispatcher";
import { articleDocumentSchema } from "@/features/articles/document";
import { findAdminArticle, findAdminMediaByIds } from "@/features/admin-articles/repository";
import { mayEditArticle } from "@/features/admin-articles/contracts";
import { requireStaffSession } from "@/lib/auth/session";
import { createPublicationRepository } from "@/features/publication/repositories";
import { toDate } from "@/features/publication/date-utils";

export const dynamic = "force-dynamic";

export default async function AdminArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaffSession();
  const article = await findAdminArticle((await params).id);
  if (!article || !mayEditArticle(session.user.role, session.user.id, article.authorId)) notFound();
  const document = articleDocumentSchema.safeParse(article.contentDocument);
  if (!document.success) notFound();
  const mediaIds = [...new Set([article.featuredMediaId, article.secondaryMediaId,
    ...document.data.blocks.flatMap((block) => block.type === "image" || block.type === "chapter" ? [block.mediaId] : [])]
    .filter((id): id is string => Boolean(id)))];
  const repository = createPublicationRepository();
  const [media, related] = await Promise.all([findAdminMediaByIds(mediaIds), repository.listRelatedPublished(article.id,
    { limit: 5, keyword: article.slug.startsWith("demo-27o-golden-cup-2027-") ? "Golden Cup" : undefined })]);
  const relatedMedia = await repository.findPublicMediaByIds(related.map((story) => story.featuredMediaId)
    .filter((id): id is string => Boolean(id)));
  const relatedStories = related.map((story) => ({ slug: story.slug, title: story.title, excerpt: story.excerpt,
    author: story.authorName, publishedLabel: toDate(story.publishedAt)?.toLocaleDateString("el-GR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) ?? null,
    image: relatedMedia.find((item) => item.id === story.featuredMediaId) }));
  return <><HeaderPreview onLight /><main id="main-content" className="public-article-page admin-article-preview">
    <p className="admin-article-preview__notice" role="status">Προεπισκόπηση · {article.status}</p>
    <ArticleDispatcher templateKey={article.articleTemplate ?? "longform"} title={article.title}
      category="Προεπισκόπηση άρθρου" author={session.user.name ?? "Acadimies"} document={document.data}
      featuredImage={media.find((item) => item.id === article.featuredMediaId)}
      secondaryImage={media.find((item) => item.id === article.secondaryMediaId)} media={media} relatedStories={relatedStories} />
  </main><PublicationFooter year={new Date().getUTCFullYear()} /></>;
}
