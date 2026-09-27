"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { headlineMotion, headlineSplitMode } from "@/lib/animations/headline-mode";
import { afterPageTransition } from "@/lib/animations/after-page-transition";
import { AdminLoginForm } from "./AdminLoginForm";
import Image from "next/image";

export function AdminLoginExperience({
  callbackUrl,
  googleEnabled,
  year,
  backgroundImage,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  year: number;
  backgroundImage: string;
}) {
  const scope = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const root = scope.current;
    const heading = title.current;
    if (!root || !heading) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = root.querySelectorAll<HTMLElement>("[data-login-reveal]");
    if (reducedMotion) {
      gsap.set([visual.current, heading, ...revealTargets], { clearProps: "all" });
      root.dataset.motionReady = "true";
      return;
    }

    const splitType = headlineSplitMode(heading.textContent);
    const titleMotion = headlineMotion(splitType);
    const split = SplitText.create(heading, {
      type: splitType,
      mask: splitType,
      charsClass: "headline-char",
      wordsClass: "headline-word",
      aria: "auto",
    });
    const titleTargets = splitType === "chars" ? split.chars : split.words;
    gsap.set(visual.current, { clipPath: "inset(100% 0 0 0)" });
    gsap.set(titleTargets, { yPercent: 110 });
    gsap.set(revealTargets, { y: 28, autoAlpha: 0 });

    const timeline = gsap.timeline({ paused: true,
      defaults: { ease: "power4.out" },
      onComplete: () => {
        root.dataset.motionReady = "true";
        gsap.set([visual.current, ...revealTargets], { clearProps: "willChange" });
      },
    });
    timeline
      .to(visual.current, {
        clipPath: "inset(0% 0 0 0)",
        duration: 1.25,
        ease: "power4.inOut",
      })
      .to(titleTargets, {
        yPercent: 0,
        duration: titleMotion.duration,
        stagger: titleMotion.stagger,
        ease: "power3.out",
      }, "-=.78")
      .to(revealTargets, {
        y: 0,
        autoAlpha: 1,
        duration: 0.72,
        stagger: 0.075,
      }, "-=0.5");
    const cancelWait = afterPageTransition(() => timeline.play(0));

    return () => {
      cancelWait();
      timeline.kill();
      split.revert();
    };
  }, { scope });

  return (
    <main ref={scope} id="main-content" className="admin-login-shell" data-admin-login-motion>
      <div ref={visual} className="admin-login-visual" aria-hidden="true">
        <Image className="admin-login-visual__image" src={backgroundImage} alt="" fill sizes="100vw" priority />
        <div className="admin-login-visual__glow" />
        <div className="admin-login-visual__pitch">
          <span className="admin-login-visual__circle" />
          <span className="admin-login-visual__line" />
        </div>
        <p>Ακαδημίες · Newsroom</p>
      </div>

      <section className="admin-login-intro" aria-labelledby="admin-login-title">
        <p className="admin-login-kicker" data-login-reveal>Ιδιωτική συντακτική πρόσβαση</p>
        <h1 ref={title} id="admin-login-title">Σύνδεση συντακτικής ομάδας</h1>
        <p className="admin-login-dek" data-login-reveal>
          Οι ιστορίες του ελληνικού και διεθνούς αναπτυξιακού ποδοσφαίρου ξεκινούν εδώ.
        </p>
      </section>

      <section className="admin-login-panel" aria-label="Φόρμα σύνδεσης" data-login-reveal>
        <header>
          <p>Acadimies editorial desk</p>
          <span aria-hidden="true">01 / 01</span>
        </header>
        <h2>Καλώς ήρθατε</h2>
        <p>Συνδεθείτε με το ιδιωτικό όνομα χρήστη του λογαριασμού σας.</p>
        <AdminLoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
        <footer data-login-reveal>
          <span>Προστατευμένο περιβάλλον</span>
          <span>Acadimies © {year}</span>
        </footer>
      </section>
    </main>
  );
}
