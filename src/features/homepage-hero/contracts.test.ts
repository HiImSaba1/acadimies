import { describe, expect, it } from "vitest";
import { selectLatestHeroStories } from "./contracts";

describe("latest-five editorial hero", () => {
  it("returns at most five records in deterministic newest-first order", () => {
    const records = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      publishedAt: new Date(`2026-09-${String(index + 1).padStart(2, "0")}T10:00:00Z`),
    }));
    expect(selectLatestHeroStories(records).map((record) => record.id)).toEqual(["6", "5", "4", "3", "2"]);
  });

  it("excludes records without a publication date", () => {
    expect(selectLatestHeroStories([{ id: "draft", publishedAt: null }])).toEqual([]);
  });
});
