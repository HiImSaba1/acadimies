import { describe, expect, it } from "vitest";
import { buildSearchHref, canRunPublicSearch, parsePublicSearchParams } from "./contracts";

describe("public search contracts", () => {
  it("normalizes bounded URL input and accepts only known categories", () => {
    expect(parsePublicSearchParams({ q: "  παιδί   ψυχολογία ", category: "paidi-psychologia", page: "2" })).toEqual({
      query: "παιδί ψυχολογία", category: "paidi-psychologia", page: 2,
    });
    expect(parsePublicSearchParams({ q: "x", category: "../../admin", page: "-4" })).toEqual({ query: "x", category: null, page: 1 });
  });

  it("requires a meaningful query and produces encoded navigation URLs", () => {
    expect(canRunPublicSearch("π")).toBe(false);
    expect(canRunPublicSearch("παιδί")).toBe(true);
    expect(buildSearchHref({ query: "παιδί & γονείς", category: null, page: 1 }, 2)).toBe("/search?q=%CF%80%CE%B1%CE%B9%CE%B4%CE%AF+%26+%CE%B3%CE%BF%CE%BD%CE%B5%CE%AF%CF%82&page=2");
  });
});
