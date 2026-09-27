"use client";

import { useEffect } from "react";
import { postViewSessionKey } from "@/features/analytics/contracts";

export function PostViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = postViewSessionKey(slug);
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "pending");
    } catch { /* Analytics remains optional if storage is unavailable. */ }
    void fetch("/api/analytics/post-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) throw new Error("View was not recorded.");
      try { window.sessionStorage.setItem(key, "recorded"); } catch { /* optional */ }
    }).catch(() => {
      try { window.sessionStorage.removeItem(key); } catch { /* optional */ }
    });
  }, [slug]);
  return null;
}
