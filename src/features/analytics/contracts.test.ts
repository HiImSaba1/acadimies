import { describe, expect, it } from "vitest";
import { postViewInputSchema, postViewSessionKey } from "./contracts";

describe("anonymous readership analytics", () => {
  it("accepts only bounded public slugs", () => {
    expect(postViewInputSchema.parse({ slug: "akadimia-neon-2026" })).toEqual({ slug: "akadimia-neon-2026" });
    expect(postViewInputSchema.safeParse({ slug: "../admin" }).success).toBe(false);
    expect(postViewInputSchema.safeParse({ slug: "post", ip: "127.0.0.1" }).success).toBe(false);
  });
  it("uses a deterministic session-only deduplication key", () => {
    expect(postViewSessionKey("story-one")).toBe("acadimies:post-view:story-one");
  });
});
