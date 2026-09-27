"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { headlineMotion, headlineSplitMode } from "@/lib/animations/headline-mode";
import { afterPageTransition } from "@/lib/animations/after-page-transition";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

type CategoryArchiveHeroProps = {
  title: string;
  eyebrow: string;
  description: string;
  note: string;
  image: string;
};

export function CategoryArchiveHero({ title, eyebrow, description, note, image }: CategoryArchiveHeroProps) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const summary = useRef<HTMLParagraphElement>(null);
  const layoutVersion = useResponsiveLayoutVersion();

  useGSAP(() => {
    if (!heading.current || !summary.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set("[data-category-hero-copy]", { clearProps: "all" });
      return;
    }

    const titleSplitType = headlineSplitMode(title);
    const titleMotion = headlineMotion(titleSplitType);
    const titleSplit = SplitText.create(heading.current, { type: titleSplitType, mask: titleSplitType,
      charsClass: "headline-char", wordsClass: "headline-word", aria: "auto" });
    const titleTargets = titleSplitType === "chars" ? titleSplit.chars : titleSplit.words;
    const summarySplit = SplitText.create(summary.current, { type: "lines,words", mask: "lines", aria: "auto" });
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo("[data-category-hero-meta]", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8 })
      .fromTo(titleTargets, { yPercent: 110 }, {
        yPercent: 0, duration: titleMotion.duration,
        stagger: titleMotion.stagger, ease: "power3.out",
      }, .08)
      .fromTo(summarySplit.lines, { yPercent: 105, autoAlpha: 0 }, {
        yPercent: 0, autoAlpha: 1, duration: 1, stagger: .12,
      }, .38);
    const cancelWait = afterPageTransition(() => timeline.play(0));

    return () => {
      cancelWait();
      timeline.kill();
      titleSplit.revert();
      summarySplit.revert();
    };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  return (
    <header ref={root} className="category-archive-hero">
      <ParallaxMedia className="category-archive-hero__media">
        <Image src={image} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="category-archive-hero__image" />
      </ParallaxMedia>
      <div className="category-archive-hero__overlay" aria-hidden="true" />
      <div className="category-archive-hero__content site-shell">
        <p data-category-hero-copy data-category-hero-meta>{eyebrow}</p>
        <h1 ref={heading} data-category-hero-copy data-category-hero-title>{title}</h1>
        <div data-category-hero-copy>
          <p ref={summary} data-category-hero-summary>{description}</p>
          <span data-category-hero-meta>{note}</span>
        </div>
      </div>
    </header>
  );
}
