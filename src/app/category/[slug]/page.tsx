import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { CategoryPaginationGrid } from "@/components/editorial/CategoryPaginationGrid";
import { CategoryArchiveHero } from "@/components/editorial/CategoryArchiveHero";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { CATEGORY_PAGE_SIZE, getCategoryStories, getCategoryStoryCount } from "@/features/category-pages/data";
import { categoryPageBySlug, categoryPages } from "@/features/category-pages/catalog";
import { CategorySortMenu } from "@/components/editorial/CategorySortMenu";
import { parseCategoryPage, parseCategorySort } from "@/features/category-pages/sorting";

export const revalidate = 300;

export function generateStaticParams() {
  return categoryPages.map(({ slug }) => ({ slug }));
}

type CategoryPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string | string[]; page?: string | string[] }> };

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const category = categoryPageBySlug(slug);
  if (!category) return {};
  const requestedSort = query.sort;
  const sort = parseCategorySort(Array.isArray(requestedSort) ? requestedSort[0] : requestedSort);
  const page = parseCategoryPage(Array.isArray(query.page) ? query.page[0] : query.page);
  const canonical = sort === "related" && page > 1 ? `/category/${category.slug}?page=${page}` : `/category/${category.slug}`;
  return {
    title: page > 1 ? `${category.name} – Σελίδα ${page}` : category.name,
    description: category.description,
    alternates: { canonical },
    openGraph: { title: `${category.name} | Ακαδημίες`, description: category.description, type: "website", url: canonical },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const requestedSort = query.sort;
  const sort = parseCategorySort(Array.isArray(requestedSort) ? requestedSort[0] : requestedSort);
  const page = parseCategoryPage(Array.isArray(query.page) ? query.page[0] : query.page);
  const category = categoryPageBySlug(slug);
  if (!category) notFound();
  const [initialStories, totalStories] = await Promise.all([
    getCategoryStories(slug, (page - 1) * CATEGORY_PAGE_SIZE, CATEGORY_PAGE_SIZE, sort),
    getCategoryStoryCount(slug),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalStories / CATEGORY_PAGE_SIZE));
  const vintage = slug === "proponitiki" || slug === "nea-akadimion";

  return <PageEntrance>
    <HeaderPreview />
    <main id="main-content" className={`category-archive${vintage ? " category-archive--vintage" : ""}`}>
      <CategoryArchiveHero
        title={category.name}
        eyebrow={category.eyebrow}
        description={category.description}
        note={initialStories.length ? "Νέα άρθρα, αναλύσεις και ιδέες" : "Η ενότητα προετοιμάζεται"}
        image={category.heroImage}
      />
      <section className="site-shell category-archive-feed" aria-label={`Άρθρα: ${category.name}`}>
        <div className="category-archive-feed__bar"><p>{category.name} · Αρχείο</p><CategorySortMenu value={sort} /></div>
        <CategoryPaginationGrid key={`${slug}-${sort}`} slug={slug} sort={sort} initialStories={initialStories} initialPage={page} initialTotalPages={totalPages} initialHasPrevious={page > 1} initialHasNext={page < totalPages} />
      </section>
    </main>
    <PublicationFooter year={new Date().getUTCFullYear()} />
  </PageEntrance>;
}
