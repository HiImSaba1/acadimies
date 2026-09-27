import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

const primaryActions = [
  { href: "/admin/articles/new", title: "Νέο άρθρο", text: "Ξεκίνα από template, συμπλήρωσε τη φόρμα ή ανέβασε AI JSON και έλεγξέ το πριν το αποθηκεύσεις." },
  { href: "/admin/articles", title: "Άρθρα ανά έτος", text: "Βρες, φίλτραρε και επεξεργάσου υπάρχοντα άρθρα χωρίς να ψάχνεις στη βάση." },
  { href: "/admin/newsletter", title: "Newsletter", text: "Δες συνδρομητές και ετοίμασε καμπάνιες όταν η αποστολή είναι ενεργή." },
  { href: "/admin/guide", title: "Οδηγός χρήσης", text: "Βήμα-βήμα οδηγίες για την καθημερινή ροή, εικόνες, δημοσίευση και έλεγχο." },
];

const helperLinks = [
  { href: "/admin/content-health", title: "Υγεία περιεχομένου", text: "Έλεγχος για άρθρα που λείπουν βασικά στοιχεία." },
  { href: "/admin/analytics", title: "Αναγνωσιμότητα", text: "Συγκεντρωτικές προβολές χωρίς προσωπικά δεδομένα." },
  { href: "/admin/imports", title: "Μεταφορά WordPress", text: "Review παλιών εγγραφών μόνο όταν χρειάζεται migration έλεγχος.", capability: "migration:review" as const },
  { href: "/admin/publication-queue", title: "Automation", text: "Προγραμματισμένα άρθρα και τελευταίες εκτελέσεις automation.", capability: "article:publish" as const },
];

export default async function AdminHomePage() {
  const session = await requireStaffSession();
  const visibleHelperLinks = helperLinks.filter((link) => !link.capability || can(session.user.role, link.capability));

  return (
    <main className="admin-dashboard">
      <p>Πίνακας διαχείρισης</p>
      <header className="admin-dashboard__hero">
        <div>
          <h1>Καλώς ήρθες, {session.user.name}</h1>
          <span>Δούλεψε από εδώ: γράψε άρθρο, βρες παλιό περιεχόμενο, έλεγξε δημοσίευση ή άνοιξε τον οδηγό.</span>
        </div>
        <Link href="/admin/guide">Άνοιγμα οδηγού →</Link>
      </header>

      <section className="admin-dashboard__quick-links" aria-labelledby="admin-primary-actions">
        <h2 id="admin-primary-actions">Καθημερινές ενέργειες</h2>
        <div>
          {primaryActions.map((action) => <Link key={action.href} href={action.href}>
            <strong>{action.title}</strong>
            <span>{action.text}</span>
          </Link>)}
        </div>
      </section>

      <section className="admin-dashboard__utility" aria-labelledby="admin-helper-links">
        <h2 id="admin-helper-links">Έλεγχοι και εργαλεία</h2>
        <div>
          {visibleHelperLinks.map((link) => <Link key={link.href} href={link.href}>
            <strong>{link.title}</strong>
            <span>{link.text}</span>
          </Link>)}
        </div>
      </section>

      <section className="admin-dashboard__rules" aria-labelledby="admin-safe-rules">
        <h2 id="admin-safe-rules">Γρήγοροι κανόνες</h2>
        <ul>
          <li>Πρώτα αποθήκευση ως πρόχειρο ή για έλεγχο, μετά δημοσίευση.</li>
          <li>Οι εικόνες ανεβαίνουν από τη βιβλιοθήκη άρθρου και πρέπει να είναι έως 300KB.</li>
          <li>Το AI JSON γεμίζει τη φόρμα, αλλά κάνεις review πριν εφαρμοστεί.</li>
          <li>Μην αλλάζεις slug δημοσιευμένου άρθρου χωρίς λόγο, γιατί επηρεάζει δημόσιο URL.</li>
        </ul>
      </section>
    </main>
  );
}
