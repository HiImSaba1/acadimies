"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type TransitionDocument = Document & {
  activeViewTransition?: { finished: Promise<void> };
};

export function RouteFocusManager() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const resetScroll = () => window.dispatchEvent(new Event("acadimies:route-scroll-top"));
    resetScroll();
    const frame = window.requestAnimationFrame(() => {
      resetScroll();
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    const postNavigationFrame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(resetScroll));
    const transition = (document as TransitionDocument).activeViewTransition;
    let cancelled = false;
    void transition?.finished.then(() => {
      if (!cancelled) resetScroll();
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(postNavigationFrame);
    };
  }, [pathname]);

  return null;
}
