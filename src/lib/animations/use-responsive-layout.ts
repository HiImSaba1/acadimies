"use client";

import { useSyncExternalStore } from "react";

let version = 0;
let viewportWidth: number | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notifyAfterWidthChange() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const nextWidth = window.innerWidth;
    if (viewportWidth === nextWidth) return;
    viewportWidth = nextWidth;
    version += 1;
    listeners.forEach((listener) => listener());
  }, 140);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    viewportWidth = window.innerWidth;
    window.addEventListener("resize", notifyAfterWidthChange, { passive: true });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("resize", notifyAfterWidthChange);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = null;
      viewportWidth = null;
    }
  };
}

const getSnapshot = () => version;
const getServerSnapshot = () => 0;

export function useResponsiveLayoutVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
