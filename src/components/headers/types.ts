import type { HeaderTemplateKey } from "@/features/publication/contracts";

export type HeaderTemplateProps = {
  activeKey: HeaderTemplateKey;
};

export const headerTemplateLabels: Record<HeaderTemplateKey, string> = {
  minimal_editorial: "Minimal Editorial",
  classic_broadsheet: "Classic Broadsheet",
  neon_sports: "Modern Neon Sports",
  split_ticker: "Split Ticker",
  mega_menu_grid: "Mega-menu Grid",
};

export const headerNavigation = [
  { label: "Νέα ακαδημιών", description: "Η επικαιρότητα από την Ελλάδα και τον κόσμο", href: "/category/nea-akadimion" },
  { label: "Προπονητική", description: "Ιδέες, μέθοδοι και εξέλιξη μέσα στο γήπεδο", href: "/category/proponitiki" },
  { label: "Παιδί & ψυχολογία", description: "Αυτοπεποίθηση, πίεση και χαρά του παιχνιδιού", href: "/category/paidi-psychologia" },
  { label: "Γονείς", description: "Η συμπεριφορά που στηρίζει τη διαδρομή του παιδιού", href: "/category/goneis" },
  { label: "Συνεντεύξεις", description: "Οι φωνές των ανθρώπων του αναπτυξιακού ποδοσφαίρου", href: "/category/synentefxeis" },
  { label: "Διεθνής ματιά", description: "Τι αλλάζει στις ακαδημίες έξω από την Ελλάδα", href: "/category/diethnis-matia" },
  { label: "Επικοινωνία", description: "Πρότεινε μια ιστορία στη συντακτική ομάδα", href: "/contact" },
] as const;
