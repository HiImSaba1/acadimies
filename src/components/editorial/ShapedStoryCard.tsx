"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import type { DemoStory } from "@/content/demo-home";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { EditorialArtwork } from "./EditorialArtwork";
import { publicationDate } from "./PublicationDateBadge";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

export function ShapedStoryCard({ story, accent = "paper" }: { story: DemoStory; accent?: "paper" | "ink" | "sage" }) {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLElement>(null);
  const dateText = useRef<HTMLSpanElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const overlayTitle = useRef<HTMLParagraphElement>(null);
  const overlaySplit = useRef<SplitText | null>(null);
  const layoutVersion = useResponsiveLayoutVersion();
  const date = publicationDate(story.publishedAt || story.previewDate);

  useGSAP(() => {
    if (!root.current || !frame.current || !media.current || !title.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const split = dateText.current ? SplitText.create(dateText.current, { type: "chars", mask: "chars", aria: "hidden" }) : null;
    const timeline = gsap.timeline({ paused: true, onComplete: () => {
      frame.current?.style.removeProperty("will-change");
      badge.current?.style.removeProperty("will-change");
      media.current?.style.removeProperty("will-change");
    } });
    timeline.fromTo(frame.current, { clipPath: "inset(0 100% 0 0)" }, {
      clipPath: "inset(0 0% 0 0)", duration: .55, ease: "power3.inOut",
      onStart: () => frame.current?.style.setProperty("will-change", "clip-path"),
    });
    if (badge.current) timeline.fromTo(badge.current, { clipPath: "circle(0% at 50% 50%)" }, {
      clipPath: "circle(75% at 50% 50%)", duration: .42, ease: "power3.out",
      onStart: () => badge.current?.style.setProperty("will-change", "clip-path"),
    }, "<.14");
    timeline.fromTo(media.current, { scale: 1.09, autoAlpha: .6 }, {
      scale: 1, autoAlpha: 1, duration: .72, ease: "power3.out",
      onStart: () => media.current?.style.setProperty("will-change", "transform, opacity"),
    }, "<.1").fromTo(title.current, { y: 18, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: .58, ease: "power3.out",
    }, "<.12");
    if (split) timeline.fromTo(split.chars, { yPercent: 105, autoAlpha: 0 }, {
      yPercent: 0, autoAlpha: 1, duration: .45, stagger: .025, ease: "power3.out",
    }, "<.25");
    const trigger = gsap.to({}, { scrollTrigger: {
      trigger: root.current, start: "top 86%", once: true, invalidateOnRefresh: true,
      onEnter: () => timeline.play(),
    } });
    return () => { trigger.kill(); timeline.kill(); split?.revert(); };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  useGSAP(() => {
    if (!overlayTitle.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    overlaySplit.current = SplitText.create(overlayTitle.current, { type: "lines,words", mask: "lines", aria: "hidden" });
    gsap.set(overlaySplit.current.words, { yPercent: 105, autoAlpha: 0, rotation: 2 });
    return () => { overlaySplit.current?.revert(); overlaySplit.current = null; };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  const animateOverlay = (visible: boolean) => {
    if (!overlaySplit.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf(overlaySplit.current.words);
    gsap.to(overlaySplit.current.words, { yPercent: visible ? 0 : 105, autoAlpha: visible ? 1 : 0,
      rotation: visible ? 0 : 2, duration: visible ? .46 : .18, stagger: visible ? .018 : 0,
      ease: visible ? "power3.out" : "power2.in", overwrite: true });
  };

  return <article ref={root} className="shaped-story-card" data-accent={accent}
    onPointerEnter={(event) => { if (event.pointerType !== "touch") animateOverlay(true); }}
    onPointerLeave={() => animateOverlay(false)} onFocusCapture={() => animateOverlay(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) animateOverlay(false); }}>
    <div ref={frame} className="shaped-story-card__frame">
      <div ref={media} className="shaped-story-card__media">
        <EditorialArtwork variant={story.artwork} label={story.imageAlt} source={story.imageUrl} />
      </div>
      <div className="shaped-story-card__veil" aria-hidden="true" />
      <div className="shaped-story-card__overlay" aria-hidden="true"><p>{story.category}</p>
        <p ref={overlayTitle}>{story.title}</p><span /></div>
      <div className="shaped-story-card__copy">
        <p>{story.category}</p>
        <h3 ref={title}>{story.title}</h3>
        <span aria-hidden="true" />
      </div>
      <Link className="shaped-story-card__hit" href={story.href ?? "/article-preview?template=longform"} aria-label={`${story.title}, άρθρο`} />
    </div>
    {date && (story.publishedAt ? <time ref={(node) => { badge.current = node; }} className="shaped-story-card__date" dateTime={story.publishedAt}
      aria-label={`Δημοσιεύτηκε ${date.day} ${date.month} ${date.year}`}>
      <span ref={dateText} className="publication-date-badge__stack"><span>{date.badgeMonth}</span><span>{date.badgeYear}</span></span>
    </time> : <span ref={badge} className="shaped-story-card__date" role="img"
      aria-label={`Ενδεικτική ημερομηνία σχεδιασμού ${date.short}`}><span ref={dateText} className="publication-date-badge__stack"><span>{date.badgeMonth}</span><span>{date.badgeYear}</span></span></span>)}
  </article>;
}
