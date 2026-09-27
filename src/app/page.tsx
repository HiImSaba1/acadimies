import Image from "next/image";
import { Fragment } from "react";
import { BreakingTicker } from "@/components/editorial/BreakingTicker";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { StoryCard } from "@/components/editorial/StoryCard";
import { LatestStoriesHero } from "@/components/editorial/LatestStoriesHero";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { NewsletterCTA } from "@/components/editorial/NewsletterCTA";
import { DraggableStoryRail } from "@/components/editorial/DraggableStoryRail";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { tickerItems } from "@/content/demo-home";
import { getHomepageHeroStories } from "@/features/homepage-hero/data";
import { getHomepageCategoryMosaic } from "@/features/homepage-cards/data";
import { getCategoryStories } from "@/features/category-pages/data";
import { ShapedStoryCard } from "@/components/editorial/ShapedStoryCard";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createPublicationRepository } from "@/features/publication/repositories";
import { parseLegacyWordPressId } from "@/features/publication/legacy-routing";
import { getHomepageCategoryVarietyStories } from "@/features/homepage-most-read/data";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { AnimatedLines } from "@/components/motion/AnimatedLines";
import { AnimatedRule } from "@/components/motion/AnimatedRule";
import { newsletterOutcomeMessage } from "@/features/newsletter/confirmation-message";

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const newsletterOutcome = newsletterOutcomeMessage(query?.newsletter);
  const requestedLegacyId = parseLegacyWordPressId(query?.p);
  if (query?.p !== undefined && requestedLegacyId === null) notFound();
  if (requestedLegacyId !== null) {
    if (process.env.PUBLICATION_DATA_SOURCE !== "database") notFound();
    const legacyPost = await createPublicationRepository().findPublishedByLegacyId(requestedLegacyId);
    if (!legacyPost) notFound();
    permanentRedirect(`/posts/${legacyPost.slug}`);
  }
  const heroStories = await getHomepageHeroStories();
  const [categoryMosaic, mostRead, mostViewed, coaching, people] = await Promise.all([
    getHomepageCategoryMosaic(heroStories.map((story) => story.slug)),
    getCategoryStories("paidi-psychologia", 0, 3),
    getHomepageCategoryVarietyStories(),
    getCategoryStories("proponitiki", 0, 4),
    getCategoryStories("synentefxeis", 0, 4),
  ]);
  const trendingStories = heroStories.slice(0, 4).map((story) => ({
    slug: story.slug, category: story.category, title: story.title, excerpt: story.excerpt,
    author: story.author, readingTime: story.readingTime, artwork: story.artwork,
    imageAlt: story.imageAlt, imageUrl: story.imageUrl ?? undefined, href: story.href,
    publishedAt: story.publishedAt,
    previewDate: story.previewDate,
  }));
  return (
    <PageEntrance>
      <HeaderPreview />

      <main id="main-content">
        <LatestStoriesHero stories={heroStories} />
        {trendingStories.length > 0 && <section className="site-shell trending-strip" aria-labelledby="trending-title">
          <div className="trending-strip__heading"><AnimatedLines as="span">Η έκδοση σήμερα</AnimatedLines><AnimatedHeadline id="trending-title">Τέσσερις ιστορίες στην πρώτη γραμμή</AnimatedHeadline></div>
          <div className="trending-strip__grid">{trendingStories.map((story, index) =>
            <ShapedStoryCard key={story.slug} story={story} accent={index === 1 ? "sage" : index === 2 ? "ink" : "paper"} />)}</div>
        </section>}
        <BreakingTicker items={tickerItems} />

        {categoryMosaic.length > 0 && <section className="site-shell category-mosaic" aria-label="Η έκδοση ανά θέμα">
          <div className="category-mosaic__groups">{categoryMosaic.map((category, index) => <Fragment key={category.slug}>
            <div className="category-mosaic__group" data-category-slug={category.slug} data-layout={index % 3 === 0 ? "feature" : index % 3 === 1 ? "grid" : "stack"}>
              <AnimatedRule />
              <div className="category-mosaic__group-head"><AnimatedLines as="span">{String(index + 1).padStart(2, "0")}</AnimatedLines>
                <h3><Link href={`/category/${category.slug}`}><AnimatedLines as="span">{category.name}</AnimatedLines></Link></h3><AnimatedLines>{category.description}</AnimatedLines></div>
              <div className="category-mosaic__stories">{category.stories.map((story, position) =>
                <ShapedStoryCard key={story.slug} story={story} accent={(index + position) % 2 ? "sage" : "paper"} />)}</div>
            </div>
            {category.slug === "paidi-psychologia" ? <aside className="category-mosaic__advert" aria-label="Διαφήμιση Golden Cup" data-advertisement>
              <ParallaxMedia className="category-mosaic__advert-media">
                <picture>
                  <source media="(max-width: 760px)" srcSet="/images/2026/09/ad_golden_cup_xmas_poster_mobile.webp" />
                  <Image src="/images/2026/09/ad_golden_cup_xmas_poster_desktop.webp" alt="Golden Cup, 3 έως 5 Ιανουαρίου 2027" fill sizes="(max-width: 760px) 100vw, 1440px" loading="lazy" />
                </picture>
              </ParallaxMedia>
            </aside> : null}
          </Fragment>)}</div>
        </section>}

        <section className="site-shell homepage-section latest-section" id="most-read" aria-labelledby="most-read-title" data-home-section="02">
          <SectionHeading id="most-read-title" title="Γονείς & παιδί" summary="Οι τρεις ιστορίες που ξεχώρισαν για την ψυχολογία, την υποστήριξη και τη χαρά των παιδιών μέσα και έξω από το γήπεδο." />
          <div className="story-grid story-grid--latest">
            {mostRead.map((story, index) => <ScrollReveal key={story.slug} delay={index * 0.04}><StoryCard story={story} size="standard" cardStyle="cover" /></ScrollReveal>)}
          </div>
        </section>

        <section className="homepage-section popular-carousel" id="popular" aria-labelledby="popular-title" data-home-section="03">
          <div className="site-shell"><SectionHeading id="popular-title" title="Ιστορίες που αξίζει να δεις" summary="Μια οριζόντια, απτική διαδρομή με μία ξεχωριστή ιστορία από κάθε βασική θεματική της έκδοσης." reverse inverse /></div>
          <DraggableStoryRail>
            {mostViewed.map((story, index) => <div className="popular-carousel__item" key={story.slug}><span>{String(index + 1).padStart(2, "0")}</span><StoryCard story={story} size="standard" cardStyle="carousel" /></div>)}
          </DraggableStoryRail>
        </section>

        <section className="site-shell homepage-section category-grid-section" id="coaching" aria-labelledby="coaching-title" data-home-section="04">
          <SectionHeading id="coaching-title" title="Προπονητική & ανάπτυξη" summary="Ιδέες για προπονητές και οικογένειες που αντιμετωπίζουν την ακαδημία ως χώρο μάθησης, ασφάλειας και δημιουργίας." />
          <div className="category-grid">{coaching.map((story, index) => <ScrollReveal key={story.slug} delay={index * .035}><StoryCard story={story} size="row" cardStyle="legacy" /></ScrollReveal>)}</div>
        </section>

        <section className="homepage-section newsletter-cta" id="newsletter" aria-labelledby="newsletter-title" data-home-section="06" data-layout="auto">
          <ParallaxMedia className="newsletter-cta__media">
            <Image src="/images/2026/01/25397.webp" alt="" fill sizes="100vw" className="newsletter-cta__image" />
          </ParallaxMedia>
          <div className="newsletter-cta__veil" aria-hidden="true" />
          <div className="site-shell newsletter-cta__inner">
            <SectionHeading id="newsletter-title" title="Μείνε κοντά στο παιχνίδι" summary="Ένα επιλεγμένο email με σημαντικές ιστορίες, νέες ιδέες και διοργανώσεις για το ποδόσφαιρο ακαδημιών." inverse />
            <NewsletterCTA outcome={newsletterOutcome ? { ...newsletterOutcome } : null} />
          </div>
        </section>

        <section className="site-shell homepage-section metro-section" id="people" aria-labelledby="people-title" data-home-section="05">
          <SectionHeading id="people-title" title="Πρόσωπα & συνεντεύξεις" summary="Οι φωνές των παιδιών, των γονέων και των ανθρώπων που διαμορφώνουν μια υγιή ποδοσφαιρική κουλτούρα." reverse />
          <div className="metro-grid">{people.map((story, index) => <ScrollReveal key={story.slug} delay={index * .035} className={`metro-grid__item metro-grid__item--${index + 1}`}><StoryCard story={story} size={index === 0 ? "voice-feature" : "row"} /></ScrollReveal>)}</div>
        </section>

      </main>

      <PublicationFooter year={new Date().getUTCFullYear()} />
    </PageEntrance>
  );
}
