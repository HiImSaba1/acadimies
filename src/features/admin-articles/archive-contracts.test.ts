import { describe, expect, it } from "vitest";
import { articleArchiveYear, parseAdminArticlePage, parseAdminArticleSearch, parseAdminArticleSort, parseAdminArticleStatus, parseAdminArticleYear } from "./archive-contracts";

describe("admin article archive contracts", () => {
  it("accepts bounded four-digit years only", () => {
    expect(parseAdminArticleYear("2019")).toBe(2019);
    expect(parseAdminArticleYear("19")).toBeNull();
    expect(parseAdminArticleYear("1999")).toBeNull();
    expect(parseAdminArticleYear("post-id")).toBeNull();
  });
  it("uses a closed sort list with most recent as the safe default", () => {
    expect(parseAdminArticleSort("za")).toBe("za");
    expect(parseAdminArticleSort("oldest")).toBe("oldest");
    expect(parseAdminArticleSort("anything")).toBe("recent");
    expect(parseAdminArticleSort(["za", "az"])).toBe("za");
  });
  it("normalizes and bounds archive searches", () => {
    expect(parseAdminArticleSearch("  Golden   Cup  ")).toBe("Golden Cup");
    expect(parseAdminArticleSearch(["προπονητική", "ignored"])).toBe("προπονητική");
    expect(parseAdminArticleSearch("a".repeat(120))).toHaveLength(100);
  });
  it("uses a closed publication-status filter", () => {
    expect(parseAdminArticleStatus("scheduled")).toBe("scheduled");
    expect(parseAdminArticleStatus("unknown")).toBe("all");
  });
  it("accepts bounded positive archive pages", () => {
    expect(parseAdminArticlePage("2")).toBe(2);
    expect(parseAdminArticlePage(["3", "4"])).toBe(3);
    expect(parseAdminArticlePage("0")).toBe(1);
    expect(parseAdminArticlePage("next")).toBe(1);
  });
  it("groups imported drafts by historical publication date", () => {
    expect(articleArchiveYear({ publishedAt: new Date("2019-04-10T00:00:00Z"), createdAt: new Date("2026-01-01T00:00:00Z") })).toBe(2019);
    expect(articleArchiveYear({ publishedAt: null, scheduledFor: new Date("2027-01-03T10:00:00Z"), createdAt: new Date("2026-01-01T00:00:00Z") })).toBe(2027);
    expect(articleArchiveYear({ publishedAt: null, createdAt: new Date("2025-01-01T00:00:00Z") })).toBe(2025);
  });
});
