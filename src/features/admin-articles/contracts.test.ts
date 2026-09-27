import { describe, expect, it } from "vitest";
import { defaultArticleDocument, mayEditArticle, mayUseStatus, parseArticleFormData, parseArticleRevisionSnapshot, parseNewTagNames } from "./contracts";

describe("editorial mutation contracts", () => {
  it("enforces ownership for authors", () => {
    expect(mayEditArticle("author", "author-1", "author-1")).toBe(true);
    expect(mayEditArticle("author", "author-1", "author-2")).toBe(false);
    expect(mayEditArticle("editor", "editor-1", "author-2")).toBe(true);
  });

  it("reserves publish and archive states for publishing roles", () => {
    expect(mayUseStatus("author", "draft")).toBe(true);
    expect(mayUseStatus("author", "published")).toBe(false);
    expect(mayUseStatus("author", "scheduled")).toBe(false);
    expect(mayUseStatus("editor", "published")).toBe(true);
    expect(mayUseStatus("editor", "scheduled")).toBe(true);
  });

  it("converts a scheduled wall-clock value from Greece time to UTC", () => {
    const data = new FormData();
    data.set("title", "Προγραμματισμένο άρθρο");
    data.set("status", "scheduled");
    data.set("scheduledFor", "2027-01-05T12:30");
    data.set("articleTemplate", "longform");
    data.set("contentDocument", JSON.stringify(defaultArticleDocument()));
    const parsed = parseArticleFormData(data);
    expect(parsed.success && parsed.data.scheduledFor).toBe("2027-01-05T10:30:00.000Z");
  });

  it("rejects malformed JSON and accepts a valid persisted document", () => {
    const invalid = new FormData();
    invalid.set("title", "Έγκυρος τίτλος");
    invalid.set("slug", "valid-slug");
    invalid.set("status", "draft");
    invalid.set("articleTemplate", "longform");
    invalid.set("contentDocument", "not-json");
    expect(parseArticleFormData(invalid).success).toBe(false);

    invalid.set("contentDocument", JSON.stringify(defaultArticleDocument()));
    expect(parseArticleFormData(invalid).success).toBe(true);
  });

  it("suggests Greeklish on creation but preserves a persisted slug on edit", () => {
    const data = new FormData();
    data.set("title", "Ακαδημίες στην Ελλάδα");
    data.set("status", "draft");
    data.set("articleTemplate", "longform");
    data.set("contentDocument", JSON.stringify(defaultArticleDocument()));
    const creation = parseArticleFormData(data);
    expect(creation.success && creation.data.slug).toBe("akadimies-stin-ellada");
    const editing = parseArticleFormData(data, "kept-editorial-slug");
    expect(editing.success && editing.data.slug).toBe("kept-editorial-slug");
    data.set("slug", "manual-story");
    const manual = parseArticleFormData(data, "kept-editorial-slug");
    expect(manual.success && manual.data.slug).toBe("manual-story");
  });

  it("validates article image IDs and persists native SEO fields", () => {
    const data = new FormData();
    data.set("title", "Ακαδημίες στην Ελλάδα");
    data.set("status", "draft");
    data.set("articleTemplate", "longform");
    data.set("contentDocument", JSON.stringify(defaultArticleDocument()));
    data.set("featuredMediaId", "not-a-media-id");
    expect(parseArticleFormData(data).success).toBe(false);
    data.set("featuredMediaId", "d9595a13-2205-4c17-90f6-0e7754b568de");
    data.set("seoTitle", "Ακαδημίες στην Ελλάδα — νέα προσέγγιση");
    data.set("seoDescription", "Νέες ιδέες για τις ακαδημίες ποδοσφαίρου.");
    const parsed = parseArticleFormData(data);
    expect(parsed.success && parsed.data.featuredMediaId).toBe("d9595a13-2205-4c17-90f6-0e7754b568de");
    expect(parsed.success && parsed.data.seoTitle).toContain("νέα προσέγγιση");
  });

  it("deduplicates bounded SEO keywords and validates selected tag IDs", () => {
    expect(parseNewTagNames("Ψυχολογία, προπόνηση; Ψυχολογία\nγονείς")).toEqual(["Ψυχολογία", "προπόνηση", "γονείς"]);
    const data = new FormData();
    data.set("title", "Ακαδημίες στην Ελλάδα");
    data.set("status", "draft");
    data.set("articleTemplate", "longform");
    data.set("contentDocument", JSON.stringify(defaultArticleDocument()));
    data.append("tagIds", "d9595a13-2205-4c17-90f6-0e7754b568de");
    data.set("newTags", "Ψυχολογία παιδιών, προπονητική");
    const parsed = parseArticleFormData(data);
    expect(parsed.success && parsed.data.tagIds).toHaveLength(1);
    expect(parsed.success && parsed.data.newTagNames).toEqual(["Ψυχολογία παιδιών", "προπονητική"]);
  });

  it("accepts complete revision snapshots and rejects malformed restoration data", () => {
    const snapshot = {
      title: "Ακαδημίες στην Ελλάδα", slug: "akadimies-stin-ellada", excerpt: "",
      status: "draft", headerTemplate: null, articleTemplate: "longform", categoryId: null,
      featuredMediaId: null, secondaryMediaId: null, seoTitle: "", seoDescription: "",
      tagIds: [], newTagNames: [], contentDocument: defaultArticleDocument(),
    };
    expect(parseArticleRevisionSnapshot(snapshot).success).toBe(true);
    expect(parseArticleRevisionSnapshot({ ...snapshot, contentDocument: { blocks: "invalid" } }).success).toBe(false);
  });
});
