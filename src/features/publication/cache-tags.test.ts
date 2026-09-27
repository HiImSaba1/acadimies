import { describe, expect, it } from "vitest";
import {
  affectedPublicationTags,
  publicationCacheTags,
} from "./cache-tags";

describe("publication cache tags", () => {
  it("creates stable post and category tags", () => {
    expect(publicationCacheTags.post("  Νέα Ομάδων  ")).toBe(
      "publication:post:νέα-ομάδων",
    );
    expect(
      affectedPublicationTags({
        postSlug: "match-report",
        categorySlugs: ["Academies", "Match Day"],
      }),
    ).toEqual([
      "publication",
      "publication:latest",
      "publication:feed",
      "publication:news",
      "publication:post:match-report",
      "publication:category:academies",
      "publication:category:match-day",
    ]);
  });
});
