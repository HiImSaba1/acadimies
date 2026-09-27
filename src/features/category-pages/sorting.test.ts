import { describe, expect, it } from "vitest";
import { parseCategoryPage, parseCategorySort } from "./sorting";

describe("category sorting", () => {
  it("accepts only public archive sort modes", () => {
    expect(parseCategorySort("recent")).toBe("recent");
    expect(parseCategorySort("oldest")).toBe("oldest");
    expect(parseCategorySort("related")).toBe("related");
    expect(parseCategorySort("popular")).toBe("related");
    expect(parseCategorySort(["oldest"])).toBe("related");
  });

  it("accepts only bounded positive archive page numbers", () => {
    expect(parseCategoryPage("2")).toBe(2);
    expect(parseCategoryPage("0")).toBe(1);
    expect(parseCategoryPage("2.5")).toBe(1);
    expect(parseCategoryPage("next")).toBe(1);
    expect(parseCategoryPage(["2"])).toBe(1);
  });
});
