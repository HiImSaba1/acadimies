import { describe, expect, it } from "vitest";
import { parseInlineFormatting, safeEditorialHref } from "./inline-format";

describe("safe editorial inline formatting", () => {
  it("recognizes emphasis, bold text and links without producing HTML", () => {
    expect(parseInlineFormatting("Νέα **ιδέα** και *μέθοδος* [άρθρο](/posts/example)"))
      .toEqual([
        { kind: "text", text: "Νέα " }, { kind: "strong", text: "ιδέα" },
        { kind: "text", text: " και " }, { kind: "emphasis", text: "μέθοδος" },
        { kind: "text", text: " " }, { kind: "link", text: "άρθρο", href: "/posts/example" },
      ]);
  });

  it("rejects script and protocol-relative links", () => {
    expect(safeEditorialHref("javascript:alert(1)")).toBeNull();
    expect(safeEditorialHref("//evil.example")).toBeNull();
    expect(parseInlineFormatting("[click](javascript:alert(1))").every((token) => token.kind !== "link")).toBe(true);
  });
});
