"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function AnimatedRule() {
  const rule = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const element = rule.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return;
    }
    const tween = gsap.fromTo(element, { scaleX: 0 }, {
      scaleX: 1,
      duration: 1,
      ease: "power3.out",
      clearProps: "transform",
      onStart: () => element.style.setProperty("will-change", "transform"),
      onComplete: () => element.style.removeProperty("will-change"),
      scrollTrigger: { trigger: element, start: "top 90%", once: true, invalidateOnRefresh: true },
    });
    return () => {
      tween.kill();
      element.style.removeProperty("will-change");
    };
  }, { scope: rule });

  return <span ref={rule} className="animated-editorial-rule" aria-hidden="true" />;
}
