const greekPairs: Record<string, string> = {
  ου: "ou", αι: "ai", ει: "ei", οι: "oi", υι: "yi",
  μπ: "mp", ντ: "nt", γκ: "gk", γγ: "ng", τσ: "ts", τζ: "tz",
};

const greekLetters: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i",
  θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x",
  ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y",
  φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

export function suggestGreeklishSlug(title: string): string {
  const normalized = title.toLocaleLowerCase("el").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const transliterated = normalized.replace(/ου|αι|ει|οι|υι|μπ|ντ|γκ|γγ|τσ|τζ|[α-ω]/g, (part) =>
    greekPairs[part] ?? greekLetters[part] ?? part,
  );
  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191)
    .replace(/-+$/g, "");
  return slug || "arthro";
}
