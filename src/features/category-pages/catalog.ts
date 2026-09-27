export const categoryPages = [
  { slug: "nea-akadimion", legacySlug: "%ce%bd%ce%ad%ce%b1-%ce%bf%ce%bc%ce%ac%ce%b4%cf%89%ce%bd", name: "Νέα ακαδημιών", eyebrow: "Ελλάδα & κόσμος", description: "Ρεπορτάζ, διοργανώσεις και εξελίξεις από το ποδόσφαιρο ακαδημιών στην Ελλάδα και διεθνώς.", heroImage: "/images/2025/04/25334.webp" },
  { slug: "proponitiki", legacySlug: "proponitika-athlitiatrika", name: "Προπονητική", eyebrow: "Μέθοδος & εξέλιξη", description: "Ιδέες και σύγχρονες πρακτικές που κάνουν την προπόνηση χώρο μάθησης, δημιουργίας και ασφάλειας.", heroImage: "/images/2016/03/387.webp" },
  { slug: "paidi-psychologia", legacySlug: "athlitiki-psychologia", name: "Παιδί & ψυχολογία", eyebrow: "Πριν από το αποτέλεσμα", description: "Αυτοπεποίθηση, πίεση, σχέσεις και η ψυχική πλευρά της εμπειρίας ενός παιδιού στο ποδόσφαιρο.", heroImage: "/images/2016/03/391.webp" },
  { slug: "goneis", legacySlug: "arthrografia", name: "Γονείς", eyebrow: "Στήριξη στην πράξη", description: "Καθαρή, χρήσιμη αρθρογραφία για τη συμπεριφορά που προστατεύει τη χαρά και την εξέλιξη του παιδιού.", heroImage: "/images/2016/03/387.webp" },
  { slug: "synentefxeis", legacySlug: "%cf%83%cf%85%ce%bd%ce%b5%ce%bd%cf%84%ce%b5%cf%8d%ce%be%ce%b5%ce%b9%cf%82", name: "Συνεντεύξεις", eyebrow: "Οι άνθρωποι του γηπέδου", description: "Παιδιά, προπονητές, ειδικοί και δημιουργοί μιας πιο υγιούς ποδοσφαιρικής κουλτούρας μιλούν στην Ακαδημίες.", heroImage: "/images/2025/04/25322.webp" },
  { slug: "diethnis-matia", legacySlug: "%ce%b4%ce%b9%ce%b5%ce%b8%ce%bd%ce%ae-%ce%bd%ce%ad%ce%b1", name: "Διεθνής ματιά", eyebrow: "Ιδέες χωρίς σύνορα", description: "Όσα εφαρμόζουν οι ακαδημίες του κόσμου και μπορούν να ανοίξουν νέους δρόμους για το ελληνικό ποδόσφαιρο.", heroImage: "/images/2016/03/372.webp" },
] as const;

export type CategoryPageSlug = (typeof categoryPages)[number]["slug"];
export const categoryPageBySlug = (slug: string) => categoryPages.find((category) => category.slug === slug);
