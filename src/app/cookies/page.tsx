import type { Metadata } from "next";
import Link from "next/link";
import { EditorialInformationPage } from "@/components/editorial/EditorialInformationPage";
import { CookiePreferencesButton } from "@/components/editorial/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Πολιτική cookies", description: "Πώς χρησιμοποιεί η Ακαδημίες τα απαραίτητα cookies και πώς μπορείς να αλλάξεις την επιλογή σου.",
  alternates: { canonical: "/cookies" },
  robots: { index: false, follow: true },
};

export default function CookiesPage() {
  return <EditorialInformationPage eyebrow="Διαφάνεια / 01" title="Πολιτική cookies"
    intro="Μια καθαρή εικόνα για τις επιλογές που αποθηκεύονται στο πρόγραμμα περιήγησής σου.">
    <section><h2>Τι χρησιμοποιούμε τώρα</h2><p>Ο δημόσιος ιστότοπος δεν φορτώνει υπηρεσία στατιστικής ανάλυσης, διαφημιστικά pixels ή ενσωματωμένες ροές κοινωνικών δικτύων. Τα cookies που χρειάζονται για ασφαλή σύνδεση αφορούν μόνο όσους χρησιμοποιούν το προστατευμένο συντακτικό περιβάλλον.</p></section>
    <section><h2>Η επιλογή σου</h2><p>Το cookie <code>acadimies_optional_cookies_v1</code> κρατά για 180 ημέρες την απόφασή σου για προαιρετικές τεχνολογίες. Η αποδοχή δεν ενεργοποιεί σήμερα πρόσθετο tracker. Αν προστεθεί προαιρετική υπηρεσία στο μέλλον, η πολιτική και ο μηχανισμός συναίνεσης θα ενημερωθούν· η προηγούμενη επιλογή δεν θα χρησιμοποιηθεί ως άδεια για νέο σκοπό.</p><CookiePreferencesButton /></section>
    <section><h2>Cookies σύνδεσης</h2><p>Κατά τη σύνδεση στο admin, η εφαρμογή και ο πάροχος αυθεντικοποίησης χρησιμοποιούν cookies συνεδρίας και προστασίας αιτημάτων. Είναι απαραίτητα για την πρόσβαση και την ασφάλεια του λογαριασμού, όχι για παρακολούθηση επισκεπτών.</p></section>
    <section><h2>Άλλη τοπική αποθήκευση</h2><p>Ο επεξεργαστής άρθρων μπορεί να αποθηκεύει προσωρινά πρόχειρα στο τοπικό πρόγραμμα περιήγησης του συντάκτη για ανάκτηση. Αυτή η δυνατότητα δεν αφορά τους αναγνώστες. Μπορείς επίσης να διαγράψεις cookies και δεδομένα ιστότοπου από τις ρυθμίσεις του browser σου.</p></section>
    <section><h2>Επικοινωνία</h2><p>Για ερωτήσεις σχετικά με τα cookies ή τις επιλογές σου, γράψε στο <a href="mailto:info@acadimies.gr">info@acadimies.gr</a>. Διάβασε επίσης την <Link href="/privacy-policy">πολιτική απορρήτου</Link>.</p></section>
  </EditorialInformationPage>;
}
