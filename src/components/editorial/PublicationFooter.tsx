"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { EditorialButton } from "@/components/ui/EditorialButton";
import { NewsletterCTA } from "./NewsletterCTA";
import { categoryPages } from "@/features/category-pages/catalog";
import { useResponsiveLayoutVersion } from "@/lib/animations/use-responsive-layout";

const quickLinks = categoryPages.slice(0, 5);

function officialSocialUrl(value: string | undefined, hostname: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === hostname || url.hostname === `www.${hostname}`) ? url.href : null;
  } catch { return null; }
}

export function PublicationFooter({ year }: { year: number }) {
  const root = useRef<HTMLElement>(null);
  const layoutVersion = useResponsiveLayoutVersion();
  const facebookUrl = officialSocialUrl(process.env.NEXT_PUBLIC_ACADIMIES_FACEBOOK_URL || "https://www.facebook.com/acadimies", "facebook.com");
  const instagramUrl = officialSocialUrl(process.env.NEXT_PUBLIC_ACADIMIES_INSTAGRAM_URL || "https://www.instagram.com/acadimies/", "instagram.com");

  useGSAP(() => {
    const footer = root.current;
    const title = footer?.querySelector<HTMLElement>("[data-footer-title]");
    if (!footer) return;
    const copy = footer.querySelectorAll<HTMLElement>("[data-footer-copy]");
    const splits = [...(title ? [title] : []), ...copy].map((element) => SplitText.create(element, { type: "lines,words", mask: "lines", aria: "auto" }));
    const words = splits.flatMap((split) => split.words);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([footer, ...words], { clearProps: "all" });
      return () => splits.forEach((split) => split.revert());
    }
    gsap.set(footer, { clipPath: "inset(100% 0 0 0)", willChange: "clip-path" });
    gsap.set(words, { yPercent: 115, autoAlpha: 0, rotate: 1.5, willChange: "transform" });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: "top bottom",
        once: true,
        invalidateOnRefresh: true,
      },
    });
    timeline
      .to(footer, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.inOut", clearProps: "willChange" })
      .to(words, { yPercent: 0, autoAlpha: 1, rotate: 0, duration: .68, stagger: .018, ease: "power4.out", clearProps: "transform,willChange" }, "-=.38");
    return () => {
      timeline.kill();
      splits.forEach((split) => split.revert());
    };
  }, { scope: root, dependencies: [layoutVersion], revertOnUpdate: true });

  return (
    <footer ref={root} className="publication-footer" data-site-footer data-footer-animation="words">
      <div className="site-shell publication-footer__top">
        <section data-footer-item>
          <h2 data-footer-copy>Για να μένετε ενημερωμένοι για όσα συμβαίνουν στο ποδόσφαιρο ακαδημιών.</h2>
          <NewsletterCTA compact source="footer" />
        </section>
        <nav data-footer-item className="publication-footer__links" aria-label="Πλοήγηση υποσέλιδου">
          <h3 className="eyebrow" data-footer-copy lang="en">Quick links</h3>
          {quickLinks.map((category) => <EditorialButton key={category.slug} href={`/category/${category.slug}`}
            label={category.name} variant="outline" className="publication-footer__link" />)}
        </nav>
        <div data-footer-item className="publication-footer__socials">
          <div className="publication-footer__social-column">
            <h3 className="eyebrow" data-footer-copy lang="en">Socials</h3>
            {facebookUrl ? <EditorialButton href={facebookUrl} label="Facebook" variant="outline" className="publication-footer__link" target="_blank" rel="noopener noreferrer" lang="en" />
              : <span className="publication-footer__pending-social" aria-label="Facebook: επίσημος σύνδεσμος εκκρεμεί">Facebook</span>}
            {instagramUrl ? <EditorialButton href={instagramUrl} label="Instagram" variant="outline" className="publication-footer__link" target="_blank" rel="noopener noreferrer" lang="en" />
              : <span className="publication-footer__pending-social" aria-label="Instagram: επίσημος σύνδεσμος εκκρεμεί">Instagram</span>}
            <EditorialButton href="/dora-ioakeimidou" label="Δώρα Ιωακειμίδου" variant="outline" className="publication-footer__link" />
          </div>
          <nav className="publication-footer__legal" aria-label="Νομικές πληροφορίες">
            <h3 className="eyebrow" data-footer-copy>Νομικά</h3>
            <EditorialButton href="/privacy-policy" label="Απόρρητο" variant="outline" className="publication-footer__link" />
            <EditorialButton href="/cookies" label="Cookies" variant="outline" className="publication-footer__link" />
          </nav>
        </div>
      </div>
      <div className="site-shell publication-footer__base" data-footer-item>
        <span data-footer-copy>© {year} Acadimies.gr</span>
        <a data-footer-copy href="https://sabaweb.gr" target="_blank" rel="noopener noreferrer" lang="en">Made by Saba Web Solutions</a>
        <span data-footer-copy lang="en">Football Academies Journal</span>
      </div>
    </footer>
  );
}
