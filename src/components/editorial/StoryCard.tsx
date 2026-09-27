"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import type { DemoStory } from "@/content/demo-home";
import { EditorialArtwork } from "./EditorialArtwork";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { PublicationDateBadge } from "./PublicationDateBadge";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

export function StoryCard({ story, size, inverse = false, cardStyle = "shaped" }: { story: DemoStory; size: "feature" | "standard" | "compact" | "row" | "voice-feature"; inverse?: boolean; cardStyle?: "shaped" | "legacy" | "cover" | "carousel" }) {
  const hasMedia = size !== "compact" && size !== "voice-feature";
  const cover = cardStyle === "cover" || cardStyle === "carousel";
  const hasMediaOverlay = (size === "feature" || size === "standard") && !cover;
  const shaped = cardStyle === "shaped" && hasMediaOverlay;
  const coverWithMedia = cover && hasMedia;
  const root = useRef<HTMLElement>(null);
  const overlayTitle = useRef<HTMLParagraphElement>(null);
  const split = useRef<SplitText | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const layoutVersion = useResponsiveLayoutVersion();
  const readingTimeMatch = story.readingTime.match(/^(\d+)(?:\s+λεπτ(?:ά|ό)|')$/iu);
  const compactReadingTime = readingTimeMatch ? `${readingTimeMatch[1]}' read` : null;
  useGSAP(() => {
    if (!overlayTitle.current) return;
    split.current = SplitText.create(overlayTitle.current, { type: "lines,words", mask: "lines", aria: "hidden" });
    gsap.set(split.current.words, { yPercent: 115, autoAlpha: 0, rotation: 2 });
    return () => {
      split.current?.revert();
      split.current = null;
    };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  const close = (immediate = false) => {
    setOverlayOpen(false);
    if (!split.current) return;
    const reduced = immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(split.current.words);
    gsap.to(split.current.words, { yPercent: 110, autoAlpha: 0, duration: reduced ? 0 : .14, stagger: 0, ease: "power2.in", overwrite: true });
  };
  const open = () => {
    document.dispatchEvent(new CustomEvent("acadimies:story-card-active", { detail: root.current }));
    setOverlayOpen(true);
    if (!split.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(split.current.words);
    gsap.to(split.current.words, { yPercent: 0, autoAlpha: 1, rotation: 0, duration: reduced ? 0 : .3, stagger: reduced ? 0 : .012, ease: "power3.out", overwrite: true });
  };
  useEffect(() => {
    const deactivate = (event: Event) => {
      const card = root.current;
      if ((event as CustomEvent<HTMLElement | null>).detail !== card) close(true);
    };
    document.addEventListener("acadimies:story-card-active", deactivate);
    return () => document.removeEventListener("acadimies:story-card-active", deactivate);
  });
  const pointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    open();
  };
  const blur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
  };
  return (
    <article ref={root} className={`story-card story-card--${size}`} data-inverse={inverse || undefined} data-card-design={coverWithMedia ? cardStyle : shaped ? "shaped" : "legacy"} data-has-reading-time={compactReadingTime ? true : undefined} data-overlay-state={hasMediaOverlay ? (overlayOpen ? "open" : "closed") : "disabled"} onPointerEnter={hasMediaOverlay ? pointerEnter : undefined} onPointerLeave={hasMediaOverlay ? () => close() : undefined} onFocusCapture={hasMediaOverlay ? open : undefined} onBlurCapture={hasMediaOverlay ? blur : undefined}>
      <span className="story-card__category-pill" aria-label={`Κατηγορία: ${story.category}`}>
        <span aria-hidden="true">{story.category}</span>
      </span>
      {compactReadingTime ? <span className="story-card__reading-time" aria-label={`Χρόνος ανάγνωσης: ${compactReadingTime}`}>
        <Clock3 aria-hidden="true" />
        <span aria-hidden="true">{compactReadingTime}</span>
      </span> : null}
      {hasMedia && <ClipReveal className="story-card__media"><EditorialArtwork variant={story.artwork} label={story.imageAlt} source={story.imageUrl} />{hasMediaOverlay ? <div className="story-card__overlay" aria-hidden="true"><p ref={overlayTitle} className="story-card__overlay-title">{story.title}</p><span /></div> : null}{coverWithMedia && <div className="story-card__cover"><h3><Link href={story.href ?? "/article-preview?template=longform"} aria-label={`${story.title}, άρθρο`}>{story.title}</Link></h3><span className="story-card__cover-action" aria-hidden="true" /></div>}{(shaped || coverWithMedia) && <PublicationDateBadge value={story.publishedAt} previewValue={story.previewDate} className="story-card__date" />}</ClipReveal>}
      {!coverWithMedia && <div className="story-card__body">
        <h3><Link href={story.href ?? "/article-preview?template=longform"} aria-label={`${story.title}, άρθρο`}>{story.title}</Link></h3>
        {story.excerpt && size !== "compact" && <p>{story.excerpt}</p>}
        <div className="story-meta" aria-hidden="true" />
      </div>}
    </article>
  );
}
