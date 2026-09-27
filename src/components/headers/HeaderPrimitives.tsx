"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { headerNavigation } from "./types";
import { useMenuHoverAnimation } from "./useMenuHoverAnimation";
import { LiveSearchModal } from "./LiveSearchModal";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="header-brand" data-compact={compact || undefined} aria-label="Ακαδημίες, αρχική σελίδα">
    <Image src="/images/2016/11/4899.webp" alt="Ακαδημίες" width={520} height={180} priority />
  </Link>;
}

function AnimatedMenuLink({ label, href, index }: { label: string; href: string; index: number }) {
  const link = useRef<HTMLAnchorElement>(null);
  useMenuHoverAnimation(link, label);
  return <Link ref={link} href={href} className="header-navigation__link"><small>{String(index + 1).padStart(2, "0")}</small><span className="header-navigation__motion"><span data-hover-text-base>{label}</span><span data-hover-text-active aria-hidden="true">{label}</span></span></Link>;
}

function FullscreenMenuLink({ label, href, index, open, previewImage, onNavigate }: { label: string; href: string; index: number; open: boolean; previewImage?: string; onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const link = useRef<HTMLAnchorElement>(null);
  useMenuHoverAnimation(link, label);
  return <div className="mobile-menu-panel__link-mask"><Link ref={link} href={href} prefetch transitionTypes={["menu-navigation"]} onClick={onNavigate} tabIndex={open ? undefined : -1} data-mobile-menu-link><span className="mobile-menu-panel__row-fill" aria-hidden="true" /><small>{String(index + 1).padStart(2, "0")}</small><span className="mobile-menu-panel__link-motion"><span data-hover-text-base>{label}</span><span data-hover-text-active aria-hidden="true">{label}</span></span>{open && previewImage ? <span className="mobile-menu-panel__preview" aria-hidden="true"><Image src={previewImage} alt="" fill sizes="(max-width: 760px) 140px, 260px" priority={index === 0} /></span> : null}</Link></div>;
}

export function PrimaryNavigation({ grid = false }: { grid?: boolean }) {
  return <nav className="header-navigation" data-grid={grid || undefined} aria-label="Κύρια πλοήγηση">{headerNavigation.map((item, index) => <AnimatedMenuLink key={item.label} label={item.label} href={item.href} index={index} />)}</nav>;
}

export function HeaderTools({ inverse = false, menuPostImages = {} }: { inverse?: boolean; menuPostImages?: Record<string, string> }) {
  const panelId = useId();
  const searchId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationTimer = useRef<number | null>(null);
  const replayingMenuNavigation = useRef(false);

  useEffect(() => () => {
    if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
  }, []);

  useEffect(() => {
    const header = root.current?.closest<HTMLElement>(".publication-header");
    header?.toggleAttribute("data-menu-open", menuOpen);
    if (menuOpen) header?.removeAttribute("data-hidden");
    return () => {
      header?.removeAttribute("data-menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    const header = root.current?.closest<HTMLElement>(".publication-header");
    if (!header) return;
    let frame = 0;
    let previousY = Math.max(0, window.scrollY);
    const update = () => {
      const currentY = Math.max(0, window.scrollY);
      const distance = currentY - previousY;
      const menuIsOpen = root.current?.querySelector<HTMLButtonElement>(".header-tool--menu")?.getAttribute("aria-expanded") === "true";
      header.toggleAttribute("data-scrolled", currentY > 40);
      if (currentY <= 150 || menuIsOpen || distance < -4) header.removeAttribute("data-hidden");
      else if (distance > 4) header.setAttribute("data-hidden", "");
      if (Math.abs(distance) > 4 || currentY <= 150) previousY = currentY;
      frame = 0;
    };
    const scroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (searchOpen) { setSearchOpen(false); root.current?.querySelector<HTMLButtonElement>(".header-tool--search")?.focus(); }
      else { setMenuOpen(false); root.current?.querySelector<HTMLButtonElement>(".header-tool--menu")?.focus(); }
    }
  };
  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(".header-tool--menu")?.focus());
  };
  const navigateFromMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (replayingMenuNavigation.current) {
      replayingMenuNavigation.current = false;
      return;
    }
    event.preventDefault();
    const link = event.currentTarget;
    setMenuOpen(false);
    if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
    navigationTimer.current = window.setTimeout(() => {
      navigationTimer.current = null;
      replayingMenuNavigation.current = true;
      link.click();
    }, 760);
  };

  return <div ref={root} className="header-tools" data-inverse={inverse || undefined} onKeyDown={keyboard}>
    <button type="button" className="header-tool header-tool--search" aria-label="Αναζήτηση" aria-expanded={searchOpen} aria-controls={searchId}
      onClick={() => { setMenuOpen(false); setSearchOpen((value) => !value); }}><Search aria-hidden="true" /></button>
    <button type="button" className="header-tool header-tool--menu" aria-expanded={menuOpen} aria-controls={panelId} onClick={() => { setSearchOpen(false); setMenuOpen((open) => !open); }}><span>{menuOpen ? "Κλείσιμο" : "Μενού"}</span>{menuOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}</button>
    <LiveSearchModal id={searchId} open={searchOpen} onClose={() => { setSearchOpen(false); window.requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(".header-tool--search")?.focus()); }} />
    <div id={panelId} className="mobile-menu-panel" aria-hidden={!menuOpen} data-state={menuOpen ? "open" : "closed"}>
      <button type="button" className="mobile-menu-panel__close" tabIndex={menuOpen ? undefined : -1} aria-label="Κλείσιμο μενού" onClick={closeMenu}><span>Κλείσιμο</span><X aria-hidden="true" /></button>
      <nav aria-label="Πλοήγηση μενού">{headerNavigation.map((item, index) => { const categorySlug = item.href.startsWith("/category/") ? item.href.slice("/category/".length) : ""; return <FullscreenMenuLink key={item.label} label={item.label} href={item.href} index={index} open={menuOpen} previewImage={menuPostImages[categorySlug]} onNavigate={navigateFromMenu} />; })}</nav>
      <div className="mobile-menu-panel__meta"><span>Θεσσαλονίκη · Ελλάδα</span></div>
    </div>
  </div>;
}

export function EditionLine({ inverse = false }: { inverse?: boolean }) {
  return <div className="edition-line" data-inverse={inverse || undefined}><span>Κυριακή, 14 Σεπτεμβρίου 2026</span><span>Youth sports · Ελλάδα</span><span>GR / EN</span></div>;
}
