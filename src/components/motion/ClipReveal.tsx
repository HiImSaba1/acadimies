"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function ClipReveal({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return;
    }
    gsap.fromTo(element, { clipPath: "inset(100% 0 0 0)" }, {
      clipPath: "inset(0% 0 0 0)",
      duration: 1,
      ease: "power4.inOut",
      onStart: () => element.style.setProperty("will-change", "clip-path"),
      onComplete: () => element.style.removeProperty("will-change"),
      scrollTrigger: { trigger: element, start: "top 90%", once: true, invalidateOnRefresh: true },
    });
  }, { scope: root });

  return <div ref={root} className={className} data-clip-reveal>{children}</div>;
}
