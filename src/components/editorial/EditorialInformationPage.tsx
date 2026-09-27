import type { ReactNode } from "react";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { PublicationFooter } from "./PublicationFooter";

export function EditorialInformationPage({ eyebrow, title, intro, children }: {
  eyebrow: string; title: string; intro: string; children: ReactNode;
}) {
  return <PageEntrance>
    <HeaderPreview onLight />
    <main id="main-content" className="editorial-information">
      <header className="site-shell editorial-information__masthead">
        <p className="eyebrow">{eyebrow}</p>
        <AnimatedHeadline as="h1">{title}</AnimatedHeadline>
        <p>{intro}</p>
      </header>
      <div className="site-shell editorial-information__body">{children}</div>
    </main>
    <PublicationFooter year={new Date().getUTCFullYear()} />
  </PageEntrance>;
}
