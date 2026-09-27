import { proofreadGreekText } from "@/features/admin-articles/greek-proofreading";

export function ProofreadingHints({ text }: { text: string }) {
  const hints = proofreadGreekText(text);
  if (!hints.length) return null;
  return <div className="article-proofreading" role="status"><strong>Συντακτικές υποδείξεις</strong><ul>{hints.map((hint) => <li key={hint.code}>{hint.message}</li>)}</ul></div>;
}
