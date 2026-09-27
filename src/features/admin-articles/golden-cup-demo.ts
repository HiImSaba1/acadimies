import { articleTemplateKeys } from "@/db/schema";
import type { ArticleDocument } from "@/features/articles/document";

type TemplateKey = (typeof articleTemplateKeys)[number];
type MediaSeed = { id: string; alt: string };

export const retiredGoldenCupDemoSlugs = [
  "demo-27o-golden-cup-2027-matchday",
  "demo-27o-golden-cup-2027-gallery",
  "demo-27o-golden-cup-2027-interview",
  "demo-27o-golden-cup-2027-cinematic",
  "demo-27o-golden-cup-2027-chess",
  "demo-27o-golden-cup-2027-sidebar",
] as const;

export const retainedGoldenCupLegacySlug = "demo-27o-golden-cup-2027-longform";
export const retainedGoldenCupSlug = "new-xmas-27o-golden-cup-2027";

const eventFacts = {
  name: "27ο Golden Cup",
  dates: "3–5 Ιανουαρίου 2027",
  venue: "Planet FC",
  academies: "32 νέες ακαδημίες",
};

const baseExcerpt = "Το 27ο Golden Cup έρχεται στις 3–5 Ιανουαρίου 2027 στο Planet FC, με 32 νέες ακαδημίες και εμπειρίες που δοκιμάζουν τις δεξιότητες των αθλητών στο υψηλότερο επίπεδο.";

const eventDetails = {
  ages: "Κ8, Κ10, Κ12, Κ14 και Κ16",
  accommodation: "Για τις αποστολές εκτός πόλης προβλέπονται επιλογές διαμονής σε συνεργαζόμενα ξενοδοχεία κοντά στις εγκαταστάσεις. Οι υπεύθυνοι των ακαδημιών μπορούν να ζητήσουν πακέτο διαμονής, πληροφορίες μετακίνησης και προτάσεις γευμάτων από τη γραμματεία της διοργάνωσης.",
  awards: "Μετά τους τελικούς θα ακολουθήσει απονομή. Οι ομάδες θα παραλάβουν κύπελλα, οι αθλητές μετάλλια και αναμνηστικά δώρα συμμετοχής, ώστε κάθε παιδί να κρατήσει μια ουσιαστική ανάμνηση από το τουρνουά.",
  booking: "Οι θέσεις ανά ηλικιακή κατηγορία είναι περιορισμένες. Κλείστε εγκαίρως τη θέση της ακαδημίας σας στο επόμενο Golden Cup και ζητήστε από τη διοργάνωση το πλήρες πρόγραμμα, το κόστος συμμετοχής και τις διαθέσιμες επιλογές φιλοξενίας.",
};

const templateTitles: Record<TemplateKey, string> = {
  longform: "Η νέα εποχή των ακαδημιών",
  matchday: "Το τριήμερο της μεγάλης δοκιμασίας",
  gallery: "Οι εικόνες μιας γιορτής των ακαδημιών",
  interview: "Όσα πρέπει να γνωρίζουν αθλητές και γονείς",
  cinematic: "Τρεις ημέρες ποδοσφαίρου στο Planet FC",
  chess: "Από την προετοιμασία στην αγωνιστική εμπειρία",
  sidebar: "Ο πλήρης οδηγός της διοργάνωσης",
};

function mediaAt(media: MediaSeed[], index: number) {
  return media[index % Math.max(media.length, 1)] ?? { id: "", alt: "Νεαροί ποδοσφαιριστές στο 27ο Golden Cup" };
}

function documentFor(template: TemplateKey, media: MediaSeed[]): ArticleDocument {
  const intro = "Από τις 3 έως τις 5 Ιανουαρίου 2027, το Planet FC γίνεται σημείο συνάντησης για 32 νέες ακαδημίες. Το 27ο Golden Cup δημιουργεί ένα απαιτητικό και ασφαλές περιβάλλον, όπου κάθε αθλητής μπορεί να δοκιμάσει τις δεξιότητές του στο υψηλότερο επίπεδο.";
  const common = { dek: baseExcerpt };
  const bookingCta = { type: "cta" as const, label: "Κλείσε θέση στο Golden Cup", href: "/contact" };
  if (template === "interview") return { ...common, blocks: [
    { type: "paragraph", text: intro },
    { type: "question", question: "Τι κάνει ξεχωριστό το 27ο Golden Cup;", answer: "Η παρουσία 32 νέων ακαδημιών, η ποικιλία αγωνιστικών εμπειριών και η έμφαση στην εξέλιξη κάθε παιδιού." },
    { type: "question", question: "Τι θα κερδίσουν οι νεαροί αθλητές;", answer: "Θα γνωρίσουν διαφορετικές ποδοσφαιρικές φιλοσοφίες, θα συνεργαστούν υπό πίεση και θα αξιολογήσουν τις δεξιότητές τους με σεβασμό στο παιχνίδι." },
    { type: "question", question: "Ποιες ηλικιακές κατηγορίες θα συμμετάσχουν;", answer: `Το αγωνιστικό πρόγραμμα θα περιλαμβάνει τις κατηγορίες ${eventDetails.ages}, με διαδρομή αγώνων προσαρμοσμένη στην ηλικία και στο αναπτυξιακό επίπεδο των παιδιών.` },
    { type: "question", question: "Υπάρχει μέριμνα για τη διαμονή των αποστολών;", answer: eventDetails.accommodation },
    { type: "question", question: "Τι θα γίνει μετά τους τελικούς;", answer: eventDetails.awards },
    { type: "quote", text: "Η πρόοδος μετριέται όταν το παιδί τολμά να δοκιμάσει όσα έμαθε.", attribution: "Συντακτική ομάδα Acadimies" },
    { type: "heading", text: "Κλείστε τη θέση της ακαδημίας σας" },
    { type: "paragraph", text: eventDetails.booking },
    bookingCta,
  ] };
  if (template === "gallery") return { ...common, blocks: [
    { type: "paragraph", text: intro },
    { type: "heading", text: `Αγωνιστικές κατηγορίες ${eventDetails.ages}` },
    { type: "paragraph", text: `Οι αθλητές θα συμμετάσχουν σε οργανωμένες αναμετρήσεις ανά ηλικία, με χρόνο για προθέρμανση, αποκατάσταση και καθοδήγηση από τους προπονητές τους. Το πρόγραμμα έχει σχεδιαστεί ώστε κάθε ομάδα να αποκτήσει ουσιαστικές αγωνιστικές παραστάσεις.` },
    ...[0, 1, 2, 3].map((index) => { const item = mediaAt(media, index); return { type: "image" as const, mediaId: item.id, alt: item.alt, caption: `Στιγμιότυπο προετοιμασίας για το 27ο Golden Cup · ${index + 1}` }; }),
    { type: "paragraph", text: "Η φωτογραφική αφήγηση ακολουθεί την προετοιμασία, τη συγκέντρωση, τη συνεργασία και τη χαρά της συμμετοχής." },
    { type: "heading", text: "Διαμονή και φιλοξενία" },
    { type: "paragraph", text: eventDetails.accommodation },
    { type: "heading", text: "Απονομές και αναμνηστικά δώρα" },
    { type: "paragraph", text: eventDetails.awards },
    { type: "quote", text: eventDetails.booking, attribution: "Δήλωση συμμετοχής · 27ο Golden Cup" },
    bookingCta,
  ] };
  if (template === "cinematic" || template === "chess") return { ...common, blocks: [
    { type: "paragraph", text: intro },
    ...[0, 1, 2, 3, 4].map((index) => { const item = mediaAt(media, index); return { type: "chapter" as const,
      heading: ["Η άφιξη των ακαδημιών", `Οι ηλικίες ${eventDetails.ages}`, "Η δοκιμασία στο γήπεδο", "Φιλοξενία για κάθε αποστολή", "Η εμπειρία που μένει"][index] ?? "27ο Golden Cup",
      text: ["Ομάδες από διαφορετικές περιοχές συναντιούνται σε ένα κοινό περιβάλλον μάθησης, ανταλλάσσουν εμπειρίες και προετοιμάζονται για τρεις ημέρες γεμάτες ποδόσφαιρο.", `Κάθε ηλικιακή κατηγορία ακολουθεί το δικό της πρόγραμμα, ώστε οι απαιτήσεις των αγώνων να ανταποκρίνονται στις ανάγκες και στο επίπεδο ανάπτυξης των παιδιών.`, "Οι αθλητές καλούνται να πάρουν αποφάσεις, να συνεργαστούν και να εκφράσουν το ταλέντο τους απέναντι σε διαφορετικές ποδοσφαιρικές φιλοσοφίες.", eventDetails.accommodation, `${eventDetails.awards} ${eventDetails.booking}`][index] ?? intro,
      mediaId: item.id, alt: item.alt, imageSide: index % 2 === 0 ? "left" as const : "right" as const }; }),
    bookingCta,
  ] };
  const body: ArticleDocument["blocks"] = [
    { type: "paragraph", text: intro },
    { type: "heading", text: "Μια νέα συνάντηση ποδοσφαιρικής εξέλιξης" },
    { type: "paragraph", text: "Οι 32 νέες ακαδημίες φέρνουν διαφορετικές μεθόδους, εμπειρίες και αγωνιστικές παραστάσεις. Η συνύπαρξη βοηθά προπονητές και παιδιά να δουν το παιχνίδι από νέες οπτικές." },
    { type: "quote", text: "Στόχος είναι κάθε παιδί να φύγει από το γήπεδο με περισσότερη γνώση, αυτοπεποίθηση και αγάπη για το ποδόσφαιρο.", attribution: "27ο Golden Cup" },
    { type: "heading", text: "3–5 Ιανουαρίου 2027 στο Planet FC" },
    { type: "paragraph", text: "Το τριήμερο πρόγραμμα σχεδιάζεται ώστε οι αθλητές να αγωνιστούν, να προσαρμοστούν και να αναδείξουν τις δυνατότητές τους, πάντα μέσα σε πλαίσιο ασφάλειας και σεβασμού." },
    { type: "heading", text: `Οι ηλικιακές κατηγορίες του τουρνουά` },
    { type: "paragraph", text: `Στο 27ο Golden Cup θα συμμετάσχουν ομάδες στις κατηγορίες ${eventDetails.ages}. Η αγωνιστική ροή οργανώνεται ανά ηλικία, ώστε κάθε παιδί να αντιμετωπίσει κατάλληλες προκλήσεις, να πάρει ουσιαστικό χρόνο συμμετοχής και να εφαρμόσει όσα δουλεύει στην προπόνηση.` },
    { type: "heading", text: "Διαμονή για ομάδες και συνοδούς" },
    { type: "paragraph", text: eventDetails.accommodation },
    { type: "heading", text: "Τελικοί, απονομές και δώρα" },
    { type: "paragraph", text: eventDetails.awards },
    { type: "heading", text: "Η επόμενη θέση μπορεί να είναι δική σας" },
    { type: "quote", text: eventDetails.booking, attribution: "Κρατήσεις συμμετοχής · 27ο Golden Cup" },
    bookingCta,
  ];
  if (template === "matchday") body.splice(3, 0, { type: "score", home: "Εμπειρία", away: "Εξέλιξη", homeScore: 27, awayScore: 32, minute: "3–5 Ιαν. 2027" });
  if (template === "sidebar") body.splice(body.length - 1, 0, { type: "heading", text: "Χρήσιμες πληροφορίες" }, { type: "paragraph", text: "Η διοργάνωση φιλοξενείται στις εγκαταστάσεις του Planet FC και δίνει έμφαση στην ποιοτική συμμετοχή των ακαδημιών." });
  return { ...common, blocks: body };
}

export function goldenCupDemoPosts(media: MediaSeed[]) {
  const template = "longform" as const;
  return [{
    template,
    title: `${eventFacts.name}: ${templateTitles.longform}`,
    slug: retainedGoldenCupSlug,
    excerpt: baseExcerpt,
    seoTitle: `27ο Golden Cup 2027: ${templateTitles[template]}`.slice(0, 60),
    seoDescription: "27ο Golden Cup, 3–5 Ιανουαρίου 2027 στο Planet FC: 32 νέες ακαδημίες δοκιμάζουν τις δεξιότητες των αθλητών στο υψηλότερο επίπεδο.",
    document: documentFor(template, media),
  }];
}
