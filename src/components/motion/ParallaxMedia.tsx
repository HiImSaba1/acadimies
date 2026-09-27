"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function ParallaxMedia({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!root.current || !media.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(media.current, { clearProps: "all" });
      return;
    }
    gsap.fromTo(media.current, { yPercent: -4 }, {
      yPercent: 4,
      ease: "none",
      scrollTrigger: {
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  }, { scope: root });

  return <div ref={root} className={className} data-parallax-media><div ref={media}>{children}</div></div>;
}
