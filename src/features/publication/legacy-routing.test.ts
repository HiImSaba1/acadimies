import { describe, expect, it } from "vitest";
import { legacyCanonicalCandidates, parseLegacyWordPressId } from "./legacy-routing";

describe("legacy WordPress routing", () => {
  it("builds exact known-origin variants for a valid legacy slug", () => {
    const candidates = legacyCanonicalCandidates("nea-akadimion");
    expect(candidates).toContain("https://acadimies.gr/nea-akadimion/");
    expect(candidates).toContain("http://acadimies.gr/nea-akadimion");
    expect(candidates.every((url) => new URL(url).hostname.endsWith("acadimies.gr"))).toBe(true);
    expect(legacyCanonicalCandidates("νέα-ακαδημιών")).toContain(
      "https://acadimies.gr/%CE%BD%CE%AD%CE%B1-%CE%B1%CE%BA%CE%B1%CE%B4%CE%B7%CE%BC%CE%B9%CF%8E%CE%BD/",
    );
  });
  it("rejects paths, query strings and arbitrary origins", () => {
    expect(legacyCanonicalCandidates("../admin")).toEqual([]);
    expect(legacyCanonicalCandidates("post?next=evil")).toEqual([]);
  });
  it("accepts only one safe positive WordPress query identifier", () => {
    expect(parseLegacyWordPressId("25397")).toBe(25397);
    expect(parseLegacyWordPressId("0")).toBeNull();
    expect(parseLegacyWordPressId("1 OR 1=1")).toBeNull();
    expect(parseLegacyWordPressId(["12", "13"])).toBeNull();
    expect(parseLegacyWordPressId("99999999999999999999")).toBeNull();
  });
});
