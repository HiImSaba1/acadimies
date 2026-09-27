"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { ContactForm } from "./ContactForm";

export function ContactExperience() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
    timeline.fromTo("[data-contact-visual]", { xPercent: -100 }, { xPercent: 0, duration: 1.35, ease: "expo.inOut" })
      .fromTo("[data-contact-image]", { scale: 1.18 }, { scale: 1, duration: 1.8 }, "-=.85")
      .fromTo("[data-contact-heading]", { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, stagger: .08 }, "-=1.05")
      .fromTo("[data-contact-form]", { x: 48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.05 }, "-=.65");
    return () => timeline.kill();
  }, { scope: root });

  return <main ref={root} id="main-content" className="contact-experience">
    <section className="contact-experience__visual" data-contact-visual><div data-contact-image><Image src="/webp/12.webp" alt="Ποδόσφαιρο ακαδημιών" fill priority sizes="(max-width: 760px) 100vw, 50vw" /></div><span aria-hidden="true" /></section>
    <section className="contact-experience__content"><div className="contact-experience__inner">
      <header><span data-contact-heading>(ΕΠΙΚΟΙΝΩΝΙΑ)</span><h1 data-contact-heading>ΕΠΙΚΟΙΝΩΝΗΣΕ ΜΑΖΙ ΜΑΣ</h1></header>
      <div data-contact-form><ContactForm /></div>
    </div></section>
  </main>;
}
