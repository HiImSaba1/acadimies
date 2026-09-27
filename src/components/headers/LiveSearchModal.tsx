"use client";

import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

type Suggestion = { type: "article" | "category"; title: string; eyebrow: string; href: string };
const subscribeToHydration = () => () => undefined;

type TransitionDocument = Document & {
  activeViewTransition?: { skipTransition: () => void };
};

function stopActivePageTransition() {
  (document as TransitionDocument).activeViewTransition?.skipTransition();
  document.getAnimations().forEach((animation) => {
    const pseudoElement = (animation.effect as KeyframeEffect | null)?.pseudoElement;
    if (pseudoElement?.startsWith("::view-transition")) animation.cancel();
  });
}

export function LiveSearchModal({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-live-search-open", open);
    if (open) stopActivePageTransition();
    return () => document.documentElement.removeAttribute("data-live-search-open");
  });

  useGSAP(() => {
    if (!root.current || !panel.current) return;
    gsap.killTweensOf([root.current, panel.current]);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (open) {
        gsap.set(root.current, { visibility: "visible", pointerEvents: "auto", autoAlpha: 1 });
        gsap.set(panel.current, { clearProps: "transform,clipPath,opacity,visibility" });
        input.current?.focus({ preventScroll: true });
      } else {
        gsap.set(root.current, { visibility: "hidden", pointerEvents: "none", autoAlpha: 0 });
      }
      return;
    }
    if (open) {
      gsap.set(root.current, { visibility: "visible", pointerEvents: "auto" });
      input.current?.focus({ preventScroll: true });
      gsap.timeline()
        .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: .42, ease: "power2.out" })
        .fromTo(panel.current, { y: 28, clipPath: "inset(0 0 100% 0)" }, {
          y: 0, clipPath: "inset(0 0 0% 0)", duration: .72, ease: "power4.out",
        }, .04);
    } else {
      gsap.timeline({ onComplete: () => {
        gsap.set(root.current, { visibility: "hidden", pointerEvents: "none" });
      } })
        .to(panel.current, { y: -12, clipPath: "inset(0 0 100% 0)", duration: .38, ease: "power3.in" })
        .to(root.current, { autoAlpha: 0, duration: .28, ease: "power2.out" }, "<.1");
    }
  }, { scope: root, dependencies: [open, hydrated] });

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    const timer = window.setTimeout(() => input.current?.focus({ preventScroll: true }), 80);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 4) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const payload = await response.json() as { results?: Suggestion[] };
        setResults(response.ok && Array.isArray(payload.results) ? payload.results.slice(0, 5) : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 260);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length < 4) { setResults([]); setLoading(false); }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab" || !root.current) return;
    const focusable = [...root.current.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute("disabled"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  if (!hydrated) return null;
  return createPortal(<div ref={root} id={id} className="live-search-modal" data-state={open ? "open" : "closed"} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-hidden={!open} inert={!open}
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={handleKeyDown}>
    <div ref={panel} className="live-search-modal__panel">
      <header><div><p>Αρχείο έκδοσης</p><h2 id={`${id}-title`}>Τι ψάχνεις;</h2></div>
        <button type="button" onClick={onClose} aria-label="Κλείσιμο αναζήτησης"><X aria-hidden="true" /></button></header>
      <div className="live-search-modal__field"><Search aria-hidden="true" />
        <input ref={input} type="search" value={query} onChange={(event) => updateQuery(event.target.value)} autoFocus={open}
          placeholder="Άρθρο, κατηγορία ή λέξη-κλειδί" aria-label="Ζωντανή αναζήτηση" aria-controls={`${id}-results`} autoComplete="off" />
      </div>
      <div className="live-search-modal__status" role="status">{query.trim().length < 4 ? "" : loading ? "Αναζήτηση…" : results.length ? `${results.length} προτάσεις` : "Δεν βρέθηκαν προτάσεις"}</div>
      <div id={`${id}-results`} className="live-search-modal__results" role="list">
        {results.map((result) => <div role="listitem" key={`${result.type}-${result.href}`}><Link href={result.href}>
          <span><small>{result.eyebrow}</small><strong>{result.title}</strong></span><ArrowUpRight aria-hidden="true" />
        </Link></div>)}
      </div>
      {query.trim().length >= 4 && <Link className="live-search-modal__all" href={`/search?q=${encodeURIComponent(query.trim())}`}>Όλα τα αποτελέσματα <ArrowUpRight aria-hidden="true" /></Link>}
    </div>
  </div>, document.body);
}
