import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { ShapedStoryCard } from "@/components/editorial/ShapedStoryCard";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { safeJsonLd } from "@/features/articles/structured-data";
import { AUTHOR_PAGE_SIZE, getPublicAuthorArchive, parseAuthorPage } from "@/features/authors/data";

export const revalidate = 300;
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }): Promise<Metadata> {
  const page = parseAuthorPage((await searchParams).page);
  return {
    title: page > 1 ? `Δώρα Ιωακειμίδου — Σελίδα ${page}` : "Δώρα Ιωακειμίδου — Συντάκτρια",
    description: "Γνώρισε τη Δώρα Ιωακειμίδου και διάβασε την αρθρογραφία της για το ποδόσφαιρο ακαδημιών.",
    alternates: { canonical: page > 1 ? `/dora-ioakeimidou?page=${page}` : "/dora-ioakeimidou" },
  };
}

export default async function DoraIoakeimidouPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const query = await searchParams;
  const page = parseAuthorPage(query.page);
  const archive = await getPublicAuthorArchive("dora-ioakeimidou", page);
  if (!archive) notFound();
  const totalPages = Math.max(1, Math.ceil(archive.total / AUTHOR_PAGE_SIZE));
  if (page > totalPages && archive.total > 0) notFound();
  const { profile } = archive;
  const person = { "@context": "https://schema.org", "@type": "Person", name: profile.displayName,
    url: `https://acadimies.gr${profile.route}`, description: profile.intro,
    sameAs: profile.facebookUrl ? [profile.facebookUrl] : undefined,
    worksFor: { "@type": "Organization", name: "Ακαδημίες", url: "https://acadimies.gr" } };

  return <PageEntrance><HeaderPreview onLight /><main id="main-content" className="author-archive">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(person) }} />
    <header className="site-shell author-archive__masthead"><p className="eyebrow">{profile.eyebrow}</p><h1>{profile.displayName}</h1><p>{profile.intro}</p></header>
    <section className="site-shell author-archive__bio" aria-labelledby="author-biography"><h2 id="author-biography">Η ματιά της</h2><p>{profile.biography}</p>{profile.facebookUrl ? <p>Ακολούθησε το <Link href={profile.facebookUrl} target="_blank" rel="noopener noreferrer">προφίλ της στο Facebook</Link>.</p> : null}</section>
    <section className="site-shell author-archive__stories" aria-labelledby="author-stories"><div className="author-archive__stories-heading"><div><p className="eyebrow">Αρθρογραφία</p><h2 id="author-stories">Οι ιστορίες της</h2></div><span>{archive.total} άρθρα</span></div>
      {archive.stories.length ? <div className="author-archive__grid">{archive.stories.map((story) => <ShapedStoryCard key={story.slug} story={story} />)}</div> : <p className="author-archive__empty">Η αρθρογραφία προετοιμάζεται.</p>}
      {totalPages > 1 ? <nav className="author-archive__pagination" aria-label="Σελιδοποίηση αρθρογραφίας">
        {page > 1 ? <Link rel="prev" href={page === 2 ? profile.route : `${profile.route}?page=${page - 1}`}>Προηγούμενη</Link> : <span />}
        <span>Σελίδα {page} από {totalPages}</span>
        {page < totalPages ? <Link rel="next" href={`${profile.route}?page=${page + 1}`}>Επόμενη</Link> : <span />}
      </nav> : null}
    </section>
  </main><PublicationFooter year={new Date().getUTCFullYear()} /></PageEntrance>;
}
