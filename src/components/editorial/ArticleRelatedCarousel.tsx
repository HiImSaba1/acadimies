"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { formatPublicationDate, toIsoDate } from "@/features/publication/date-utils";

export type RelatedStoryLink = { slug: string; title: string; excerpt: string | null; publishedAt: unknown };

export function ArticleRelatedCarousel({ stories, label, title, titleId }: {
  stories: RelatedStoryLink[];
  label: string;
  title: string;
  titleId: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    const element = rail.current;
    const card = element?.querySelector<HTMLElement>(".article-related__card");
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    const end = element.scrollWidth - element.clientWidth;
    const target = direction > 0
      ? (element.scrollLeft >= end - 4 ? 0 : Math.min(element.scrollLeft + step, end))
      : (element.scrollLeft <= 4 ? end : Math.max(element.scrollLeft - step, 0));
    element.scrollTo({ left: target, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  const start = useCallback(() => {
    stop();
    if (stories.length < 3 || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (root.current?.matches(":hover") || root.current?.contains(document.activeElement)) return;
    timer.current = setInterval(() => move(1), 5500);
  }, [move, stop, stories.length]);

  useEffect(() => {
    start();
    const visibility = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [start, stop]);

  return <div ref={root} className="article-related__carousel" onMouseEnter={stop} onMouseLeave={start} onFocusCapture={stop} onBlurCapture={start}>
    <header className="article-related__header">
      <div><p>{label}</p><h2 id={titleId}>{title}</h2></div>
      <div className="article-related__controls" aria-label="Πλοήγηση σχετικών ιστοριών">
        <button type="button" aria-label="Προηγούμενες σχετικές ιστορίες" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" aria-label="Επόμενες σχετικές ιστορίες" onClick={() => move(1)}><ArrowRight aria-hidden="true" /></button>
      </div>
    </header>
    <div ref={rail} className="article-related__rail" role="region" aria-roledescription="carousel" aria-label="Σχετικές ιστορίες" tabIndex={0} onKeyDown={(event) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }}>
      {stories.map((story) => <article className="article-related__card" key={story.slug}>
        <time dateTime={toIsoDate(story.publishedAt) ?? undefined}>{formatPublicationDate(story.publishedAt)}</time>
        <h3><Link href={`/posts/${story.slug}`}>{story.title}</Link></h3>
      </article>)}
    </div>
  </div>;
}
