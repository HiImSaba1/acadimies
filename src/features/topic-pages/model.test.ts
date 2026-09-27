import { describe, expect, it } from "vitest";
import { parseTopicPage, topicCanonical } from "./model";

describe("topic archive model", () => {
  it("bounds invalid page input to the first page", () => {
    expect(parseTopicPage("-2")).toBe(1);
    expect(parseTopicPage("word")).toBe(1);
    expect(parseTopicPage("3")).toBe(3);
  });

  it("uses a clean canonical for page one and explicit later pages", () => {
    expect(topicCanonical("golden-cup", 1)).toBe("/topic/golden-cup");
    expect(topicCanonical("golden-cup", 2)).toBe("/topic/golden-cup?page=2");
  });
});
