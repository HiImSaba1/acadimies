export type HeadlineSplitMode = "chars" | "words";

export function headlineSplitMode(value: string | null | undefined): HeadlineSplitMode {
  const wordCount = value?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return wordCount > 0 && wordCount <= 2 ? "chars" : "words";
}

export function headlineMotion(mode: HeadlineSplitMode) {
  return mode === "chars"
    ? { duration: .72, stagger: .032 }
    : { duration: .84, stagger: .068 };
}
