"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ScrollReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = scope.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return;
    }

    gsap.fromTo(element, { opacity: 0, y: 32 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay,
      ease: "power3.out",
      onStart: () => element.style.setProperty("will-change", "transform, opacity"),
      onComplete: () => element.style.removeProperty("will-change"),
      scrollTrigger: { trigger: element, start: "top 88%", once: true, invalidateOnRefresh: true },
    });
  }, { scope, dependencies: [delay], revertOnUpdate: true });

  return <div ref={scope} className={className}>{children}</div>;
}
