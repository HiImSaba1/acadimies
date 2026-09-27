import { parseInlineFormatting } from "@/features/articles/inline-format";

export function EditorialRichText({ text }: { text: string }) {
  return <>{parseInlineFormatting(text).map((token, index) => {
    if (token.kind === "strong") return <strong key={index}>{token.text}</strong>;
    if (token.kind === "emphasis") return <em key={index}>{token.text}</em>;
    if (token.kind === "link") return <a key={index} href={token.href} target={token.href?.startsWith("http") ? "_blank" : undefined} rel={token.href?.startsWith("http") ? "noopener noreferrer" : undefined}>{token.text}</a>;
    return <span key={index}>{token.text}</span>;
  })}</>;
}
