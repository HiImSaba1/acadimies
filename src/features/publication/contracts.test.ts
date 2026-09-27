import { describe, expect, it } from "vitest";
import {
  canReadEditorialContent,
  isPubliclyVisible,
  resolveTemplates,
} from "./contracts";

describe("publication contracts", () => {
  it("resolves article override, category default, then site default", () => {
    expect(
      resolveTemplates({
        postHeaderTemplate: "neon_sports",
        categoryHeaderTemplate: "classic_broadsheet",
        categoryArticleTemplate: "interview",
      }),
    ).toEqual({
      headerTemplate: "neon_sports",
      articleTemplate: "interview",
    });

    expect(resolveTemplates({})).toEqual({
      headerTemplate: "minimal_editorial",
      articleTemplate: "longform",
    });
  });

  it("only exposes published records whose UTC publication time has arrived", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    expect(
      isPubliclyVisible({
        status: "published",
        publishedAt: new Date("2026-09-14T11:59:59.000Z"),
        now,
      }),
    ).toBe(true);
    expect(
      isPubliclyVisible({
        status: "published",
        publishedAt: new Date("2026-09-14T12:00:01.000Z"),
        now,
      }),
    ).toBe(false);
    expect(
      isPubliclyVisible({ status: "review", publishedAt: null, now }),
    ).toBe(false);
  });

  it("does not grant editorial access to arbitrary roles", () => {
    expect(canReadEditorialContent("editor")).toBe(true);
    expect(canReadEditorialContent("subscriber")).toBe(false);
  });
});
