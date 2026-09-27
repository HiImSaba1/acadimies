import { ArticleDispatcher } from "@/components/article-templates/ArticleDispatcher";
import type { ArticleTemplateKey } from "@/features/publication/contracts";
import Link from "next/link";
import { PageEntrance } from "@/components/motion/PageEntrance";
import { activeArticleTemplateKeys } from "@/features/admin-articles/template-catalog";

const keys: readonly ArticleTemplateKey[] = activeArticleTemplateKeys;
export default async function ArticlePreview({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const requested = (await searchParams).template;
  const templateKey = keys.includes(requested as ArticleTemplateKey) ? requested as ArticleTemplateKey : "longform";
  const document = { dek: "Μια δοκιμαστική ιστορία που αποδεικνύει ότι το ίδιο αποθηκευμένο άρθρο μπορεί να αποκτήσει διαφορετική εκδοτική μορφή.", blocks: [
    { type: "paragraph" as const, text: "Η προπόνηση αρχίζει με χώρο για παιχνίδι, παρατήρηση και σωστές αποφάσεις." },
    { type: "score" as const, home: "Ακαδημία Βορρά", away: "Νέοι Πόλης", homeScore: 3, awayScore: 2, minute: "Τελικό" },
    { type: "question" as const, question: "Τι κρατάμε από τη διοργάνωση;", answer: "Τη συνεργασία και την εμπειρία των παιδιών." },
    { type: "image" as const, mediaId: "MEDIA PREVIEW 01", alt: "Νεαροί αθλητές μετά τον αγώνα", caption: "Η ομάδα μετά το τελευταίο σφύριγμα." },
    { type: "quote" as const, text: "Το αποτέλεσμα τελειώνει σήμερα· η μάθηση μένει.", attribution: "Προπονητική ομάδα" },
  ] };
  return <PageEntrance><main id="main-content" className="article-preview"><nav aria-label="Επιλογή προτύπου άρθρου"><Link href="/">Αρχική</Link>{keys.map((key) => <Link key={key} aria-current={key === templateKey ? "page" : undefined} href={`/article-preview?template=${key}`}>{key}</Link>)}</nav><ArticleDispatcher templateKey={templateKey} title="Το παιχνίδι ως κοινή γλώσσα" category="Μεγάλο θέμα" author="Ακαδημίες Editorial" document={document} /></main></PageEntrance>;
}
