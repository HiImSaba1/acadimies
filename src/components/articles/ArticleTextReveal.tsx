"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { afterPageTransition } from "@/lib/animations/after-page-transition";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

export function ArticleTextReveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const layoutVersion = useResponsiveLayoutVersion();

  useGSAP(() => {
    const container = root.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(container.querySelectorAll("[data-article-reveal]"), { clearProps: "all" });
      return;
    }

    let cancelled = false;
    let cancelTransitionWait: () => void = () => undefined;
    const splits: SplitText[] = [];
    const animations: ReturnType<typeof gsap.to>[] = [];

    void document.fonts.ready.then(() => {
      if (cancelled || !root.current) return;
      cancelTransitionWait = afterPageTransition(() => {
        if (cancelled || !root.current) return;
        const mobile = window.matchMedia("(max-width: 760px)").matches;
        const revealStart = mobile ? "top 90%" : "top 82%";
        const wrappers = [...root.current.querySelectorAll<HTMLElement>("[data-article-reveal]")];
        const textElements = wrappers.flatMap((wrapper) => {
          if (wrapper.matches("h2,h3,p,li,blockquote,figcaption")) return [wrapper];
          return [...wrapper.querySelectorAll<HTMLElement>("h2,h3,p,li,blockquote,figcaption")];
        }).filter((element, index, elements) => Boolean(element.textContent?.trim()) && elements.indexOf(element) === index);

        for (const element of textElements) {
          const split = SplitText.create(element, {
            type: "lines",
            mask: "lines",
            linesClass: "article-reveal-line++",
            aria: "auto",
          });
          splits.push(split);
          gsap.set(split.lines, { yPercent: 112, autoAlpha: .08, willChange: "transform,opacity" });
          const animation = gsap.to(split.lines, {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.15,
            stagger: .09,
            ease: "power4.out",
            overwrite: "auto",
            clearProps: "transform,opacity,visibility,willChange",
            scrollTrigger: {
              trigger: element,
              start: revealStart,
              once: true,
              invalidateOnRefresh: true,
              toggleActions: "play none none none",
            },
          });
          animations.push(animation);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelTransitionWait();
      animations.forEach((animation) => {
        animation.scrollTrigger?.kill();
        animation.kill();
      });
      splits.forEach((split) => split.revert());
    };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  return <div ref={root} data-article-text-reveal>{children}</div>;
}
