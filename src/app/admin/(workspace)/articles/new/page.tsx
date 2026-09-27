import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { createArticleAction } from "@/features/admin-articles/actions";
import { defaultArticleDocument } from "@/features/admin-articles/contracts";
import { listAdminCategories, listAdminTags } from "@/features/admin-articles/repository";
import { requireCapability } from "@/lib/auth/session";
import Link from "next/link";
import { activeArticleTemplateKeys, articleTemplateCatalog, isActiveArticleTemplateKey } from "@/features/admin-articles/template-catalog";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const session = await requireCapability("article:create");
  const { template } = await searchParams;
  if (!isActiveArticleTemplateKey(template)) {
    return <main className="admin-template-picker">
      <header><p>Νέο άρθρο / Βήμα 01</p><AnimatedHeadline as="h1">Διάλεξε τον τρόπο αφήγησης.</AnimatedHeadline><span>Το template μπορεί να αλλάξει αργότερα, χωρίς να χαθεί το περιεχόμενο.</span></header>
      <div className="admin-template-picker__grid">
        {activeArticleTemplateKeys.map((key) => <Link key={key} href={`/admin/articles/new?template=${key}`} className="admin-template-picker__card">
          <div className={`admin-template-picker__visual admin-template-picker__visual--${articleTemplateCatalog[key].visual}`} aria-hidden="true"><i /><i /><i /><i /></div>
          <span>0{activeArticleTemplateKeys.indexOf(key) + 1} / TEMPLATE</span>
          <h2>{articleTemplateCatalog[key].label}</h2><p>{articleTemplateCatalog[key].description}</p><strong>Επιλογή template ↗</strong>
        </Link>)}
      </div>
    </main>;
  }
  const [categories, tags] = await Promise.all([listAdminCategories(), listAdminTags()]);
  return <ArticleEditor mode="create" draftKey={`${session.user.id}:new:${template}`} action={createArticleAction} categories={categories} tags={tags} role={session.user.role} value={{ title: "", slug: "", excerpt: "", status: "draft", scheduledFor: "", headerTemplate: null, articleTemplate: template, categoryId: null, featuredMediaId: null, secondaryMediaId: null, seoTitle: "", seoDescription: "", tagIds: [], contentDocument: defaultArticleDocument() }} />;
}
