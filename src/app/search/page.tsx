import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { StoryCard } from "@/components/editorial/StoryCard";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { categoryPages } from "@/features/category-pages/catalog";
import { buildSearchHref, canRunPublicSearch, parsePublicSearchParams } from "@/features/public-search/contracts";
import { searchPublicStories } from "@/features/public-search/data";

export const metadata: Metadata = {
  title: "Αναζήτηση",
  description: "Αναζήτησε άρθρα και νέα για το ποδόσφαιρο ακαδημιών.",
  robots: { index: false, follow: true },
};

type SearchPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const input = parsePublicSearchParams(await searchParams);
  const searched = canRunPublicSearch(input.query);
  const result = await searchPublicStories(input);
  const resultLabel = !searched ? "Γράψε τουλάχιστον δύο χαρακτήρες για να ξεκινήσεις."
    : result.stories.length ? `${result.stories.length} ${result.stories.length === 1 ? "αποτέλεσμα" : "αποτελέσματα"} σε αυτή τη σελίδα`
      : "Δεν βρέθηκαν δημοσιευμένα άρθρα. Δοκίμασε διαφορετικές λέξεις.";

  return <PageEntrance>
    <HeaderPreview />
    <main id="main-content" className="search-page">
      <section className="search-hero site-shell" aria-labelledby="search-title">
        <p className="eyebrow">Αρχείο έκδοσης</p>
        <div className="search-hero__heading">
          <AnimatedHeadline as="h1" id="search-title">Αναζήτηση ιστοριών</AnimatedHeadline>
          <p>Βρες ρεπορτάζ, απόψεις και πρακτικές ιδέες για παιδιά, γονείς και προπονητές.</p>
        </div>
        <Form action="/search" className="public-search-form" role="search" scroll>
          <label htmlFor="public-search-query">Λέξεις αναζήτησης</label>
          <div className="public-search-form__query"><Search aria-hidden="true" />
            <input id="public-search-query" name="q" type="search" defaultValue={input.query} minLength={2} maxLength={100} placeholder="π.χ. παιδί, προπόνηση, γονείς" autoComplete="off" />
          </div>
          <label htmlFor="public-search-category">Θεματική ενότητα</label>
          <select id="public-search-category" name="category" defaultValue={input.category ?? ""}>
            <option value="">Όλες οι ενότητες</option>
            {categoryPages.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
          <EditorialButton type="submit" label="Αναζήτηση" variant="dark" arrow="right" />
        </Form>
      </section>

      <section className="search-results site-shell" aria-labelledby="search-results-title">
        <div className="search-results__heading">
          <h2 id="search-results-title">{searched ? <>Αποτελέσματα για «{input.query}»</> : "Το αρχείο μας"}</h2>
          <p role="status">{resultLabel}</p>
        </div>
        {result.stories.length > 0 && <div className="category-archive-grid" data-search-results>
          {result.stories.map((story, index) => <ScrollReveal key={story.slug} delay={(index % 3) * .025}><StoryCard story={story} size="standard" cardStyle={index % 3 === 2 ? "cover" : "shaped"} /></ScrollReveal>)}
        </div>}
        {searched && (input.page > 1 || result.hasNext) && <nav className="search-pagination" aria-label="Σελίδες αποτελεσμάτων">
          {input.page > 1 ? <Link href={buildSearchHref(input, input.page - 1)}>Προηγούμενη σελίδα</Link> : <span />}
          <span>Σελίδα {input.page}</span>
          {result.hasNext ? <Link href={buildSearchHref(input, input.page + 1)}>Επόμενη σελίδα</Link> : null}
        </nav>}
      </section>
    </main>
    <PublicationFooter year={new Date().getUTCFullYear()} />
  </PageEntrance>;
}
