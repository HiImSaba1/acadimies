import type { Metadata } from "next";
import { HeaderPreview } from "@/components/headers/HeaderPreview";
import { PublicationFooter } from "@/components/editorial/PublicationFooter";
import { ContactExperience } from "@/components/editorial/ContactExperience";
import { PageEntrance } from "@/components/motion/PageEntrance";

export const metadata: Metadata = { title: "Επικοινωνία", description: "Επικοινώνησε με την Ακαδημίες ή πρότεινε μια ιστορία για το ποδόσφαιρο ακαδημιών.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return <PageEntrance><HeaderPreview /><ContactExperience /><PublicationFooter year={new Date().getUTCFullYear()} /></PageEntrance>;
}
