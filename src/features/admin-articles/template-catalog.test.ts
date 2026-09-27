import { describe, expect, it } from "vitest";
import { articleTemplateKeys } from "@/db/schema";
import { activeArticleTemplateKeys, articleTemplateCatalog, isActiveArticleTemplateKey, isArticleTemplateKey } from "./template-catalog";

describe("template-first article flow", () => {
  it("provides a preview and description for every persisted template", () => {
    expect(Object.keys(articleTemplateCatalog)).toEqual([...articleTemplateKeys]);
    for (const key of articleTemplateKeys) {
      expect(articleTemplateCatalog[key].description.length).toBeGreaterThan(10);
    }
  });

  it("rejects unregistered template flags", () => {
    expect(isArticleTemplateKey("interview")).toBe(true);
    expect(isArticleTemplateKey("unknown")).toBe(false);
  });

  it("keeps retired templates persisted but unavailable for new stories", () => {
    expect(activeArticleTemplateKeys).toEqual(["longform", "gallery", "interview", "cinematic", "sidebar"]);
    expect(isActiveArticleTemplateKey("cinematic")).toBe(true);
    expect(isActiveArticleTemplateKey("matchday")).toBe(false);
    expect(isActiveArticleTemplateKey("chess")).toBe(false);
    expect(isArticleTemplateKey("matchday")).toBe(true);
    expect(isArticleTemplateKey("chess")).toBe(true);
  });
});
