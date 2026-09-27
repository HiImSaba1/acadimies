"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const lenis = reducedMotion.matches ? null : new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, wheelMultiplier: 0.88 });
    const resetScroll = () => {
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      ScrollTrigger.update();
    };
    window.addEventListener("acadimies:route-scroll-top", resetScroll);
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const refreshLayout = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenis?.resize();
        ScrollTrigger.refresh(true);
      }, 220);
    };
    window.addEventListener("resize", refreshLayout, { passive: true });

    const update = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
    }

    return () => {
      window.removeEventListener("acadimies:route-scroll-top", resetScroll);
      window.removeEventListener("resize", refreshLayout);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.history.scrollRestoration = previousRestoration;
      if (lenis) {
        lenis.off("scroll", ScrollTrigger.update);
        gsap.ticker.remove(update);
        lenis.destroy();
      }
    };
  }, []);

  return children;
}
