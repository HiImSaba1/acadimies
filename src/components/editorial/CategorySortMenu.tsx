"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import type { CategorySort } from "@/features/category-pages/sorting";

const options: Array<{ value: CategorySort; label: string }> = [
  { value: "related", label: "Σχετικά" },
  { value: "recent", label: "Πρόσφατα" },
  { value: "oldest", label: "Παλαιότερα" },
];

export function CategorySortMenu({ value }: { value: CategorySort }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const active = options.find((option) => option.value === value) ?? options[0];

  useGSAP(() => {
    const menu = root.current?.querySelector<HTMLElement>("[data-sort-options]");
    const items = root.current?.querySelectorAll<HTMLElement>("[data-sort-option]");
    if (!menu || !items) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(menu, { clipPath: open ? "inset(0)" : "inset(0 0 100% 0)" });
      return;
    }
    const timeline = gsap.timeline();
    timeline.to(menu, { clipPath: open ? "inset(0)" : "inset(0 0 100% 0)", duration: .42, ease: "power3.inOut" });
    if (open) timeline.fromTo(items, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3, stagger: .045, ease: "power2.out" }, "-=.2");
    return () => timeline.kill();
  }, { scope: root, dependencies: [open] });

  return <div ref={root} className="category-sort">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      {active.label}<ChevronDown aria-hidden="true" />
    </button>
    <div data-sort-options className="category-sort__options" role="listbox" aria-label="Ταξινόμηση άρθρων">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} data-sort-option
        onClick={() => { setOpen(false); router.push(option.value === "related" ? pathname : `${pathname}?sort=${option.value}`, { scroll: false }); }}>
        {option.label}
      </button>)}
    </div>
  </div>;
}
