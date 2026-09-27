import { describe, expect, it } from "vitest";
import { buildCategoryMosaic } from "./category-mosaic";
import type { DemoStory } from "@/content/demo-home";

const story = (slug: string): DemoStory => ({ slug, category: "Νέα", title: slug, author: "Editor",
  readingTime: "Άρθρο", artwork: "pitch", imageAlt: slug });

describe("homepage category mosaic", () => {
  it("keeps category order and newest eligible stories while excluding lead duplicates", () => {
    const groups = buildCategoryMosaic({ "nea-akadimion": [story("lead"), story("new")],
      proponitiki: [story("new"), story("coach")] }, ["lead"]);
    expect(groups.map((group) => group.slug)).toEqual(["nea-akadimion", "proponitiki"]);
    expect(groups[0]?.stories.map((item) => item.slug)).toEqual(["new"]);
    expect(groups[1]?.stories.map((item) => item.slug)).toEqual(["coach"]);
  });

  it("does not invent content for empty categories", () => {
    expect(buildCategoryMosaic({}, [])).toEqual([]);
  });

  it("builds four-card left grids and two-card right stacks", () => {
    const many = (prefix: string) => Array.from({ length: 6 }, (_, index) => story(`${prefix}-${index + 1}`));
    const groups = buildCategoryMosaic({
      "nea-akadimion": many("news"),
      proponitiki: many("coach"),
      "paidi-psychologia": many("child"),
    }, []);
    expect(groups.find((group) => group.slug === "proponitiki")?.stories).toHaveLength(4);
    expect(groups.find((group) => group.slug === "paidi-psychologia")?.stories).toHaveLength(2);
  });
});
