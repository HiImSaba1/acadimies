import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseAdminArticlePage, parseAdminArticleSearch, parseAdminArticleSort, parseAdminArticleStatus, parseAdminArticleYear } from "@/features/admin-articles/archive-contracts";
import { listAdminArticlesByYear } from "@/features/admin-articles/repository";
import { safePublicMediaUrl } from "@/features/admin-articles/media-contracts";
import { requireCapability } from "@/lib/auth/session";
import { ArticleArchiveActions } from "@/components/admin/ArticleArchiveActions";
import { can } from "@/lib/auth/permissions";
import { ArticleArchiveFilters } from "@/components/admin/ArticleArchiveFilters";
import { EditorialButton } from "@/components/ui/EditorialButton";

const statusLabels = { draft: "Πρόχειρο", review: "Για έλεγχο", scheduled: "Προγραμματισμένο", published: "Δημοσιευμένο", archived: "Αρχειοθετημένο" };

function formatScheduledTime(value: Date) {
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: "Europe/Athens",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminArticlesYearPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string | string[]; status?: string | string[]; page?: string | string[]; q?: string | string[]; deleted?: string }>;
}) {
  const session = await requireCapability("admin:access");
  const year = parseAdminArticleYear((await params).id);
  if (!year) notFound();
  const query = await searchParams;
  const sort = parseAdminArticleSort(query.sort);
  const search = parseAdminArticleSearch(query.q);
  const status = parseAdminArticleStatus(query.status);
  const page = parseAdminArticlePage(query.page);
  const archive = await listAdminArticlesByYear(year, sort, page, 50, search, status);
  if (page > archive.pageCount) notFound();
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (sort !== "recent") params.set("sort", sort);
    if (status !== "all") params.set("status", status);
    params.set("page", String(target));
    return `/admin/articles/${year}?${params}`;
  };
  return <main className="admin-list admin-article-year" data-admin-article-year={year}>
    <header><div><div className="admin-article-year__title"><h1>{year}</h1><span className="admin-article-year__count">— <strong>{archive.total}</strong> <small>{archive.total === 1 ? "άρθρο" : "άρθρα"}</small></span></div></div><div className="admin-list__actions"><EditorialButton href="/admin/articles" label="Όλα τα έτη" arrow="left" variant="outline" /><EditorialButton href="/admin/articles/new" label="Νέο άρθρο" arrow="right" /></div></header>
    {query.deleted === "1" ? <p className="admin-article-year__notice" role="status">Το άρθρο διαγράφηκε. Οι εικόνες και το αρχείο εισαγωγής διατηρήθηκαν.</p> : null}
    <div className="admin-article-year__toolbar"><ArticleArchiveFilters year={year} search={search} sort={sort} status={status} /></div>
    {archive.items.length ? <div className="admin-article-cards">{archive.items.map((article, index) => {
      const safeImageUrl = safePublicMediaUrl(article.imageUrl);
      const imageUrl = safeImageUrl?.startsWith("/") ? safeImageUrl : null;
      return <article key={article.id}>
        <ArticleArchiveActions id={article.id} slug={article.slug} title={article.title} year={year} canDelete={can(session.user.role, "article:delete")} />
        <div className="admin-article-card__image">{imageUrl ? <Image src={imageUrl} alt={article.imageAlt || article.title} fill unoptimized loading="eager" fetchPriority={index < 6 ? "high" : undefined} sizes="(max-width: 900px) 50vw, 33vw" /> : <span aria-hidden="true">A</span>}</div>
        <div className="admin-article-card__copy"><div><span>{statusLabels[article.status]}{article.status === "scheduled" && article.scheduledFor ? ` · ${formatScheduledTime(article.scheduledFor)}` : ""}</span><span>{article.authorName ?? "Χωρίς συντάκτη"}</span></div><h2>{article.title}</h2></div>
      </article>;
    })}</div> : <p className="admin-empty">Δεν υπάρχουν άρθρα για το {year}.</p>}
    {archive.pageCount > 1 ? <nav className="admin-article-pagination" aria-label="Σελίδες άρθρων">
      {page > 1 ? <Link href={pageHref(page - 1)}>Προηγούμενη</Link> : <span />}
      <div>{Array.from({ length: archive.pageCount }, (_, index) => index + 1).map((number) =>
        <Link key={number} href={pageHref(number)} aria-current={number === page ? "page" : undefined}>{number}</Link>)}</div>
      {page < archive.pageCount ? <Link href={pageHref(page + 1)}>Επόμενη</Link> : <span />}
    </nav> : null}
  </main>;
}
