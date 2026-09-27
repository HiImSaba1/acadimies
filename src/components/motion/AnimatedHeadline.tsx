"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/animations/gsap";
import { headlineMotion, headlineSplitMode } from "@/lib/animations/headline-mode";
import { afterPageTransition } from "@/lib/animations/after-page-transition";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

type Props = {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AnimatedHeadline({ as = "h2", children, className, id }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const layoutVersion = useResponsiveLayoutVersion();

  useGSAP(() => {
    const element = heading.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(element, { clearProps: "all" });
      return;
    }

    const splitType = headlineSplitMode(element.textContent);
    const motion = headlineMotion(splitType);
    const split = SplitText.create(element, {
      type: splitType,
      mask: splitType,
      charsClass: "headline-char",
      wordsClass: "headline-word",
      aria: "auto",
    });
    const targets = splitType === "chars" ? split.chars : split.words;
    gsap.set(targets, { yPercent: 110 });
    let tween: ReturnType<typeof gsap.to> | null = null;
    let trigger: ScrollTrigger | null = null;
    const cancelWait = afterPageTransition(() => {
      tween = gsap.to(targets, { paused: true, yPercent: 0, duration: motion.duration, stagger: motion.stagger,
        ease: "power3.out", clearProps: "transform", overwrite: true });
      trigger = ScrollTrigger.create({ trigger: element, start: "top 88%", once: true,
        invalidateOnRefresh: true, onEnter: () => tween?.play() });
    });

    return () => {
      cancelWait();
      trigger?.kill();
      tween?.kill();
      split.kill();
      split.revert();
    };
  }, { scope: heading, dependencies: [layoutVersion], revertOnUpdate: true });

  const Heading = as;
  return <Heading ref={heading} id={id} className={className} data-animated-headline>{children}</Heading>;
}
