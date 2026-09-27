"use client";

import Link from "next/link";
import { BookOpen, FilePlus2, Files, Home, Mail, PanelLeftClose, PanelLeftOpen, Send, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export function AdminWorkspaceShell({ children, userName, role, canReviewImports, canPublish }: {
  children: ReactNode;
  userName: string;
  role: string;
  canReviewImports: boolean;
  canPublish: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true);
  const [compact, setCompact] = useState(false);
  void canReviewImports;

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 760px)").matches) setMenuOpen(false);
  };

  const navigation: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Επισκόπηση", href: "/admin", icon: Home },
    { label: "Άρθρα", href: "/admin/articles", icon: Files },
    { label: "Νέο άρθρο", href: "/admin/articles/new", icon: FilePlus2 },
    ...(canPublish ? [{ label: "Automation", href: "/admin/publication-queue", icon: Send }] : []),
    { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    { label: "Οδηγός", href: "/admin/guide", icon: BookOpen },
  ];

  return (
    <div className="admin-workspace" data-menu-open={menuOpen || undefined} data-menu-compact={compact || undefined}>
      <button className="admin-workspace__scrim" type="button" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
      <aside id="admin-navigation-panel" aria-label="Πλευρικό μενού διαχείρισης">
        <div className="admin-workspace__aside-heading">
          <Link href="/admin" className="admin-wordmark" onClick={closeOnMobile} title={compact ? "ACADIMIES" : undefined}>
            <Home aria-hidden="true" />
            <span>ACADIMIES</span>
          </Link>
          <button className="admin-workspace__panel-toggle" type="button"
            aria-label={compact ? "Άνοιγμα μενού διαχείρισης" : "Σύμπτυξη μενού διαχείρισης"}
            aria-controls="admin-navigation-panel" aria-pressed={compact} onClick={() => setCompact((value) => !value)}
            title={compact ? "Show menu labels" : "Show icons only"}>
            <span>Compact menu</span>
            {compact ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        </div>
        <nav className="admin-workspace__nav" aria-label="Διαχείριση περιεχομένου" onClick={closeOnMobile}>
          {navigation.map(({ label, href, icon: Icon }, index) => {
            const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} title={compact ? label : undefined}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>;
          })}
        </nav>
        <footer className="admin-workspace__account">
          <div><strong>{userName}</strong><span>{role}</span></div>
          <AdminSignOut compact={compact} />
        </footer>
      </aside>
      <button className="admin-workspace__open-toggle" type="button" aria-label="Άνοιγμα μενού διαχείρισης"
        aria-controls="admin-navigation-panel" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
        <PanelLeftOpen aria-hidden="true" />
      </button>
      <div className="admin-workspace__main">
        {children}
      </div>
    </div>
  );
}
