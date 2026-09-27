"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { DemoStory } from "@/content/demo-home";
import { StoryCard } from "./StoryCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { loadCategoryStoriesPage } from "@/features/category-pages/actions";
import { parseCategoryPage } from "@/features/category-pages/sorting";

type Props = {
  slug: string;
  sort: string;
  initialStories: DemoStory[];
  initialPage: number;
  initialTotalPages: number;
  initialHasPrevious: boolean;
  initialHasNext: boolean;
};

function LoadingGrid() {
  return <div className="category-skeleton-grid" aria-hidden="true" data-category-skeleton>
    {Array.from({ length: 12 }, (_, index) => <div className="category-story-skeleton" key={index}>
      <span className="category-story-skeleton__media" />
      <span className="category-story-skeleton__eyebrow" />
      <span className="category-story-skeleton__title" />
      <span className="category-story-skeleton__title category-story-skeleton__title--short" />
      <span className="category-story-skeleton__meta" />
    </div>)}
  </div>;
}

export function CategoryPaginationGrid({ slug, sort, initialStories, initialPage, initialTotalPages, initialHasPrevious, initialHasNext }: Props) {
  const [stories, setStories] = useState(initialStories);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [hasPrevious, setHasPrevious] = useState(initialHasPrevious);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const region = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const request = useRef(0);
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sort !== "related") params.set("sort", sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return `/category/${slug}${query ? `?${query}` : ""}`;
  };

  const load = useCallback(async (targetPage: number, updateHistory: boolean) => {
    const nextPage = parseCategoryPage(String(targetPage));
    if (loading || nextPage === page) return;
    const requestId = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await loadCategoryStoriesPage(slug, nextPage, sort);
      if (requestId !== request.current) return;
      setStories(result.stories);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setHasPrevious(result.hasPrevious);
      setHasNext(result.hasNext);
      if (updateHistory) {
        const url = new URL(window.location.href);
        if (result.page === 1) url.searchParams.delete("page");
        else url.searchParams.set("page", String(result.page));
        window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      }
      window.requestAnimationFrame(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        region.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        status.current?.focus({ preventScroll: true });
      });
    } catch {
      if (requestId === request.current) setError("Δεν ήταν δυνατή η φόρτωση της σελίδας. Δοκίμασε ξανά.");
    } finally {
      if (requestId === request.current) setLoading(false);
    }
  }, [loading, page, slug, sort]);

  useEffect(() => {
    const handlePopState = () => {
      const target = parseCategoryPage(new URL(window.location.href).searchParams.get("page") ?? "1");
      if (target !== page) void load(target, false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [load, page]);

  return <div ref={region} className="category-pagination-region" aria-busy={loading}>
    <p ref={status} className="category-pagination__status" tabIndex={-1} aria-live="polite">
      {loading ? `Φορτώνεται η σελίδα ${page}…` : `Σελίδα ${page}`}
    </p>
    {loading ? <LoadingGrid /> : <div className="category-archive-grid" data-category-grid>
      {stories.map((story, index) => <ScrollReveal key={story.slug} delay={(index % 3) * .025}><StoryCard story={story} size="standard" cardStyle={index % 3 === 2 ? "cover" : "shaped"} /></ScrollReveal>)}
    </div>}
    {error ? <p className="category-pagination__error" role="alert">{error}</p> : null}
    <nav className="category-pagination" aria-label="Σελιδοποίηση άρθρων">
      {hasPrevious ? <EditorialButton href={pageHref(page - 1)} label="Προηγούμενη" variant="outline" arrow="left" className="category-pagination__link" aria-disabled={loading || undefined} onClick={(event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); if (!loading) void load(page - 1, true); }} /> : <EditorialButton label="Προηγούμενη" variant="outline" arrow="left" className="category-pagination__link" disabled />}
      <div className="category-pagination__pages" aria-label={`Σελίδα ${page} από ${totalPages}`}>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => pageNumber === page
          ? <span key={pageNumber} aria-current="page">{pageNumber}</span>
          : <a key={pageNumber} href={pageHref(pageNumber)} aria-label={`Σελίδα ${pageNumber}`} aria-disabled={loading || undefined} onClick={(event) => { event.preventDefault(); if (!loading) void load(pageNumber, true); }}>{pageNumber}</a>)}
      </div>
      {hasNext ? <EditorialButton href={pageHref(page + 1)} label="Επόμενη" variant="outline" arrow="right" className="category-pagination__link" aria-disabled={loading || undefined} onClick={(event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); if (!loading) void load(page + 1, true); }} /> : <EditorialButton label="Επόμενη" variant="outline" arrow="right" className="category-pagination__link" disabled />}
    </nav>
  </div>;
}
