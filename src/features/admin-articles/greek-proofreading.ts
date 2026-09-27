export type ProofreadingHint = { code: string; message: string };

const accentSuggestions: Record<string, string> = {
  ακαδημιες: "ακαδημίες", παιδια: "παιδιά", ποδοσφαιρο: "ποδόσφαιρο",
  προπονητης: "προπονητής", ψυχολογια: "ψυχολογία",
};

export function proofreadGreekText(text: string): ProofreadingHint[] {
  const hints: ProofreadingHint[] = [];
  if (/ {2,}/.test(text)) hints.push({ code: "spaces", message: "Υπάρχουν διπλά κενά." });
  if (/\s+[,.!?;:]/.test(text)) hints.push({ code: "punctuation-before", message: "Αφαίρεσε το κενό πριν από σημείο στίξης." });
  if (/[,.!?;:](?=\p{L})/u.test(text)) hints.push({ code: "punctuation-after", message: "Έλεγξε το κενό μετά το σημείο στίξης." });
  const words: string[] = [...(text.toLocaleLowerCase("el").match(/\p{L}+/gu) ?? [])];
  if (words.some((word, index) => index > 0 && word.length > 2 && word === words[index - 1])) {
    hints.push({ code: "repeated-word", message: "Μια λέξη φαίνεται να επαναλαμβάνεται συνεχόμενα." });
  }
  for (const [plain, accented] of Object.entries(accentSuggestions)) {
    if (words.includes(plain)) hints.push({ code: `accent-${plain}`, message: `Έλεγξε τον τόνο: «${accented}».` });
  }
  return hints;
}
