"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { artworkSources, EditorialArtwork } from "./EditorialArtwork";
import type { HeroStory } from "@/features/homepage-hero/contracts";
import { gsap } from "@/lib/animations/gsap";
import { EditorialButton } from "@/components/ui/EditorialButton";

export function LatestStoriesHero({ stories }: { stories: HeroStory[] }) {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const direction = useRef(1);
  const drag = useRef({ pointerId: -1, startX: 0, startY: 0 });

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  const move = useCallback((amount: number) => {
    if (stories.length < 2) return;
    direction.current = amount < 0 ? -1 : 1;
    setSelected((current) => (current + amount + stories.length) % stories.length);
  }, [stories.length]);
  const start = useCallback(() => {
    stop();
    if (root.current?.matches(":hover") || root.current?.contains(document.activeElement)) return;
    if (stories.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) return;
    timer.current = setInterval(() => move(1), 7500);
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

  useEffect(() => {
    const preloaders = stories.map((item) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = item.imageUrl ?? artworkSources[item.artwork];
      return image;
    });
    return () => {
      for (const image of preloaders) image.src = "";
    };
  }, [stories]);

  useGSAP(() => {
    if (!visual.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeline = gsap.timeline()
      .fromTo(visual.current, {
        autoAlpha: 0,
        scale: 1.018,
      }, {
        autoAlpha: 1, scale: 1, duration: .58, ease: "power2.out",
        onStart: () => visual.current?.style.setProperty("will-change", "opacity, transform"),
        onComplete: () => visual.current?.style.removeProperty("will-change"),
      })
      .fromTo("[data-hero-copy]", { y: 18, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.06, ease: "power3.out",
      }, "-=.42");
    return () => timeline.kill();
  }, { scope: root, dependencies: [selected], revertOnUpdate: true });

  if (!stories.length) {
    return <section className="latest-hero latest-hero--empty"><p>Δεν υπάρχουν ακόμη δημοσιευμένες ιστορίες.</p></section>;
  }

  const story = stories[selected];
  const readingTimeMatch = story.readingTime.match(/^(\d+)\s+λεπτ(?:ά|ό)$/iu);
  const compactReadingTime = readingTimeMatch ? `${readingTimeMatch[1]}'` : story.readingTime;
  const select = (index: number) => {
    direction.current = index >= selected ? 1 : -1;
    setSelected(index);
    start();
  };
  const beginDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("a,button")) return;
    stop();
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Synthetic touch input may not expose capture. */ }
  };
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;
    const x = event.clientX - drag.current.startX;
    const y = event.clientY - drag.current.startY;
    drag.current.pointerId = -1;
    if (Math.abs(x) >= 55 && Math.abs(x) > Math.abs(y)) move(x < 0 ? 1 : -1);
    start();
  };

  return (
    <section
      ref={root}
      className="latest-hero"
      aria-label="Οι πέντε τελευταίες ιστορίες"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocusCapture={stop}
      onBlurCapture={start}
      onPointerDown={beginDrag}
      onPointerUp={endDrag}
      onPointerCancel={start}
      data-latest-hero
    >
      <div className="latest-hero__visual" ref={visual} key={`visual-${story.id}`}>
        <EditorialArtwork variant={story.artwork} label={story.imageAlt} source={story.imageUrl ?? undefined} priority />
      </div>
      <div className="latest-hero__shade" aria-hidden="true" />
      <div className="latest-hero__copy">
        <p data-hero-copy className="eyebrow">{story.category}</p>
        <div className="latest-hero__editorial-grid">
          <div className="latest-hero__story-copy">
            <AnimatedHeadline as="h1" key={`title-${story.id}`}>{story.title}</AnimatedHeadline>
            <p data-hero-copy className="latest-hero__excerpt">{story.excerpt}</p>
          </div>
          <div className="latest-hero__story-action">
            <div data-hero-copy className="story-meta"><span>{story.author}</span><span>{compactReadingTime}</span></div>
            <EditorialButton data-hero-copy="" href={story.href ?? "/article-preview?template=longform"} label="Διάβασε περισσότερα" variant="light" />
          </div>
        </div>
      </div>
      <div className="latest-hero__controls">
        <p aria-live="polite">{String(selected + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}</p>
        <div className="latest-hero__pagination">
          {stories.map((item, index) => <button key={item.id} type="button" aria-label={`Ιστορία ${index + 1}: ${item.title}`} aria-current={selected === index ? "true" : undefined} onClick={() => select(index)} />)}
        </div>
        <div><button type="button" aria-label="Προηγούμενη ιστορία" onClick={() => { move(-1); start(); }}><ArrowLeft aria-hidden="true" /></button><button type="button" aria-label="Επόμενη ιστορία" onClick={() => { move(1); start(); }}><ArrowRight aria-hidden="true" /></button></div>
      </div>
    </section>
  );
}
