"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { afterPageTransition } from "@/lib/animations/after-page-transition";
import { gsap, ScrollTrigger, SplitText } from "@/lib/animations/gsap";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

export function AnimatedLines({ children, as = "p", className }: {
  children: ReactNode;
  as?: "p" | "span" | "small" | "div";
  className?: string;
}) {
  const element = useRef<HTMLElement>(null);
  const layoutVersion = useResponsiveLayoutVersion();
  const setElement = useCallback((node: HTMLElement | null) => {
    element.current = node;
  }, []);

  useGSAP(() => {
    const target = element.current;
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(target, { clearProps: "all" });
      return;
    }
    const split = SplitText.create(target, { type: "lines,words", mask: "lines",
      linesClass: "editorial-line", wordsClass: "editorial-word", aria: "auto" });
    gsap.set(split.lines, { yPercent: 108, autoAlpha: 0 });
    let tween: ReturnType<typeof gsap.to> | null = null;
    let trigger: ScrollTrigger | null = null;
    const cancelWait = afterPageTransition(() => {
      tween = gsap.to(split.lines, { paused: true, yPercent: 0, autoAlpha: 1, duration: .9,
        stagger: .08, ease: "power3.out", clearProps: "transform,opacity,visibility", overwrite: true });
      trigger = ScrollTrigger.create({ trigger: target, start: "top 90%", once: true,
        invalidateOnRefresh: true, onEnter: () => tween?.play() });
    });
    return () => {
      cancelWait();
      trigger?.kill();
      tween?.kill();
      split.revert();
    };
  }, { scope: element, dependencies: [layoutVersion], revertOnUpdate: true });

  const sharedProps = { ref: setElement, className, "data-animated-lines": true };
  if (as === "span") return <span {...sharedProps}>{children}</span>;
  if (as === "small") return <small {...sharedProps}>{children}</small>;
  if (as === "div") return <div {...sharedProps}>{children}</div>;
  return <p {...sharedProps}>{children}</p>;
}
