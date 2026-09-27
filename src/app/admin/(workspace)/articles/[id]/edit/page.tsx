import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { restoreArticleRevisionAction, updateArticleAction } from "@/features/admin-articles/actions";
import { articleDocumentSchema } from "@/features/articles/document";
import { listAdminCategories, listAdminTags, findAdminArticle, listAdminArticleRedirects, listAdminArticleRevisions, findAdminMediaByIds } from "@/features/admin-articles/repository";
import { mayEditArticle } from "@/features/admin-articles/contracts";
import { requireStaffSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isArticleTemplateKey } from "@/features/admin-articles/template-catalog";
import { formatAthensDateTimeLocal } from "@/features/admin-articles/schedule";

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; draftTemplate?: string; restored?: string; restoreError?: string; step?: string }> }) {
  const session = await requireStaffSession();
  const { id } = await params;
  const { created, draftTemplate, restored, restoreError, step } = await searchParams;
  const [article, categories, tags] = await Promise.all([findAdminArticle(id), listAdminCategories(), listAdminTags()]);
  if (!article || !mayEditArticle(session.user.role, session.user.id, article.authorId)) notFound();
  const document = articleDocumentSchema.safeParse(article.contentDocument);
  if (!document.success) throw new Error("The persisted article document is invalid.");
  const mediaIds = [...new Set([article.featuredMediaId, article.secondaryMediaId,
    ...document.data.blocks.flatMap((block) => block.type === "image" || block.type === "chapter" ? [block.mediaId] : [])]
    .filter((mediaId): mediaId is string => Boolean(mediaId)))];
  const [revisions, redirects, mediaAssets] = await Promise.all([listAdminArticleRevisions(article.id), listAdminArticleRedirects(article.id), findAdminMediaByIds(mediaIds)]);
  const action = updateArticleAction.bind(null, article.id);
  const restoreAction = can(session.user.role, "article:edit-any")
    ? restoreArticleRevisionAction.bind(null, article.id)
    : undefined;
  return <ArticleEditor mode="edit" initialStep={step === "4" ? 4 : undefined} draftKey={`${session.user.id}:article:${article.id}`} clearDraftKey={created === "1" && isArticleTemplateKey(draftTemplate) ? `${session.user.id}:new:${draftTemplate}` : undefined} revisions={revisions} redirects={redirects} restoreAction={restoreAction} restoredRevision={/^\d+$/.test(restored ?? "") ? Number(restored) : undefined} restoreError={Boolean(restoreError)} mediaAssets={mediaAssets} action={action} categories={categories} tags={tags} role={session.user.role} value={{ title: article.title, slug: article.slug, excerpt: article.excerpt ?? "", status: article.status, scheduledFor: formatAthensDateTimeLocal(article.scheduledFor), headerTemplate: article.headerTemplate, articleTemplate: article.articleTemplate ?? "longform", categoryId: article.categoryId, featuredMediaId: article.featuredMediaId, secondaryMediaId: article.secondaryMediaId, seoTitle: article.seoTitle ?? "", seoDescription: article.seoDescription ?? "", tagIds: article.tagIds, contentDocument: document.data }} />;
}
