import type { ArtworkVariant } from "@/components/editorial/EditorialArtwork";

export type DemoStory = { slug: string; category: string; title: string; excerpt?: string; author: string; readingTime: string; artwork: ArtworkVariant; imageAlt: string; imageUrl?: string; href?: string; publishedAt?: string | null; previewDate?: string };

export const tickerItems = ["Οι διοργανώσεις της εβδομάδας σε όλη την Ελλάδα", "Νέες προπονητικές ιδέες για ηλικίες Κ10–Κ14", "Οι άνθρωποι πίσω από τις ακαδημίες"] as const;

export const leadStory = {
  category: "Μεγάλο θέμα",
  title: "Το γήπεδο όπου μεγαλώνουν οι επόμενες γενιές",
  excerpt: "Μπαίνουμε στις ακαδημίες που επενδύουν στην υπομονή, στη γνώση και στη χαρά του παιχνιδιού — πολύ πριν έρθει το πρώτο μετάλλιο.",
  author: "Ακαδημίες Editorial",
  readingTime: "8 λεπτά",
  issueLinks: ["Η νέα κουλτούρα προπόνησης", "Γονείς στην κερκίδα", "Μικρές ομάδες, μεγάλες κοινότητες"],
} as const;

export const voicesFeature: DemoStory = {
  slug: "akadimia-pou-chtizei-charaktires",
  category: "Η γνώμη του ειδικού",
  title: "Η καλή ακαδημία χτίζει χαρακτήρες πριν χτίσει αθλητές",
  excerpt: "Γιατί η συνεργασία, η ασφάλεια και η χαρά του παιχνιδιού είναι η πραγματική βάση της εξέλιξης.",
  author: "Ακαδημίες Editorial",
  readingTime: "7 λεπτά",
  artwork: "strategy",
  imageAlt: "Παιδιά συνεργάζονται στην προπόνηση",
  previewDate: "2026-06-10T12:00:00.000Z",
};

export const homeSections: { latest: DemoStory[]; development: DemoStory[]; voices: DemoStory[] } = {
  latest: [
    { slug: "festival-neon-podosfairou", category: "Διοργανώσεις", title: "Ένα τριήμερο ποδοσφαίρου που ένωσε τη Θεσσαλονίκη", excerpt: "Παιδιά, προπονητές και οικογένειες μοιράστηκαν το ίδιο γήπεδο σε μια διοργάνωση με επίκεντρο την εμπειρία.", author: "Ακαδημίες Team", readingTime: "5 λεπτά", artwork: "tournament", imageAlt: "Νεαροί αθλητές σε ποδοσφαιρική διοργάνωση", previewDate: "2026-06-09T12:00:00.000Z" },
    { slug: "proponisi-apofaseon", category: "Προπονητικά", title: "Προπόνηση αποφάσεων, όχι απλώς επαναλήψεων", author: "Νίκος Παπαδόπουλος", readingTime: "4 λεπτά", artwork: "strategy", imageAlt: "Πίνακας τακτικής σε προπόνηση", previewDate: "2026-06-07T12:00:00.000Z" },
    { slug: "goneis-stin-kerkida", category: "Ψυχολογία", title: "Τι πραγματικά χρειάζεται να ακούσει ένα παιδί μετά τον αγώνα", author: "Δώρα Ιωακειμίδου", readingTime: "6 λεπτά", artwork: "portrait", imageAlt: "Συζήτηση γονέα και νεαρού αθλητή", previewDate: "2026-06-05T12:00:00.000Z" },
  ],
  development: [
    { slug: "paichnidi-mikron-hlikion", category: "Ανάπτυξη", title: "Γιατί στις μικρές ηλικίες το παιχνίδι είναι το πρόγραμμα", author: "Editorial", readingTime: "7 λεπτά", artwork: "pitch", imageAlt: "Προπονητικό παιχνίδι μικρών ηλικιών", previewDate: "2026-06-03T12:00:00.000Z" },
    { slug: "roloi-proponiti", category: "Η γνώμη του ειδικού", title: "Ο προπονητής ως παιδαγωγός, παρατηρητής και οδηγός", author: "Μαρία Κωνσταντίνου", readingTime: "5 λεπτά", artwork: "portrait", imageAlt: "Προπονήτρια δίπλα σε νεαρούς αθλητές", previewDate: "2026-05-29T12:00:00.000Z" },
    { slug: "metriseis-me-noima", category: "Ανάλυση", title: "Μετρήσεις με νόημα: τι αξίζει να παρακολουθεί μια ακαδημία", author: "Data Desk", readingTime: "9 λεπτά", artwork: "strategy", imageAlt: "Στοιχεία απόδοσης αθλητικής ακαδημίας", previewDate: "2026-05-26T12:00:00.000Z" },
  ],
  voices: [
    { slug: "synentefxi-neou-athliti", category: "Συνέντευξη", title: "«Θέλω να θυμάμαι τους φίλους, όχι μόνο τα γκολ»", author: "Ακαδημίες Team", readingTime: "6 λεπτά", artwork: "portrait", imageAlt: "Πορτρέτο νεαρού αθλητή", previewDate: "2026-05-23T12:00:00.000Z" },
    { slug: "mikri-topiki-akadimia", category: "Ρεπορτάζ", title: "Η μικρή τοπική ακαδημία που έγινε σημείο αναφοράς", author: "Ελένη Γεωργίου", readingTime: "8 λεπτά", artwork: "pitch", imageAlt: "Τοπική αθλητική ακαδημία", previewDate: "2026-05-20T12:00:00.000Z" },
    { slug: "foni-tou-proponiti", category: "Πρόσωπα", title: "Η ήρεμη φωνή που βοηθά τα παιδιά να πιστέψουν στον εαυτό τους", author: "Ακαδημίες Team", readingTime: "5 λεπτά", artwork: "strategy", imageAlt: "Προπονητής συζητά με παιδιά της ακαδημίας", previewDate: "2026-05-16T12:00:00.000Z" },
  ],
};
