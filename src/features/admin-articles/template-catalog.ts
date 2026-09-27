import { articleTemplateKeys } from "@/db/schema";

export type ArticleTemplateKey = (typeof articleTemplateKeys)[number];

export const activeArticleTemplateKeys = ["longform", "gallery", "interview", "cinematic", "sidebar"] as const satisfies readonly ArticleTemplateKey[];
export type ActiveArticleTemplateKey = (typeof activeArticleTemplateKeys)[number];

export const articleTemplateCatalog: Record<ArticleTemplateKey, { label: string; description: string; visual: string }> = {
  longform: { label: "Εκτενές άρθρο", description: "Ανάλυση, άποψη και μεγάλης διάρκειας αφήγηση.", visual: "essay" },
  matchday: { label: "Ρεπορτάζ", description: "Ειδήσεις και αναλυτική κάλυψη γεγονότων, χωρίς live αγώνες.", visual: "report" },
  gallery: { label: "Φωτογραφική ιστορία", description: "Εικόνες, λεζάντες και οπτική αφήγηση.", visual: "gallery" },
  interview: { label: "Συνέντευξη", description: "Ερωτήσεις, απαντήσεις και ανθρώπινες ιστορίες.", visual: "interview" },
  cinematic: { label: "Κινηματογραφικό", description: "Μεγάλη εικόνα και διαδοχικά αφηγηματικά κεφάλαια.", visual: "cinematic" },
  chess: { label: "Εναλλασσόμενα κεφάλαια", description: "Εικόνα και κείμενο εναλλάσσονται σε ρυθμό σκακιέρας.", visual: "chess" },
  sidebar: { label: "Εφημερίδα με sidebar", description: "Καθαρό άρθρο με σταθερή στήλη σχετικών ιστοριών.", visual: "sidebar" },
};

export function isArticleTemplateKey(value: unknown): value is ArticleTemplateKey {
  return typeof value === "string" && articleTemplateKeys.some((key) => key === value);
}

export function isActiveArticleTemplateKey(value: unknown): value is ActiveArticleTemplateKey {
  return typeof value === "string" && activeArticleTemplateKeys.some((key) => key === value);
}
