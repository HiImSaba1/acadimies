export type InlineToken = { kind: "text" | "strong" | "emphasis" | "link"; text: string; href?: string };

const tokenPattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;

export function safeEditorialHref(input: string): string | null {
  if (/[\\\u0000-\u001f\s]/.test(input)) return null;
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function parseInlineFormatting(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ kind: "text", text: text.slice(cursor, index) });
    if (match[2]) tokens.push({ kind: "strong", text: match[2] });
    else if (match[3]) tokens.push({ kind: "emphasis", text: match[3] });
    else {
      const href = safeEditorialHref(match[5]);
      tokens.push(href ? { kind: "link", text: match[4], href } : { kind: "text", text: match[0] });
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ kind: "text", text: text.slice(cursor) });
  return tokens;
}
