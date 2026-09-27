import { describe, expect, it } from "vitest";
import { publicAuthorByUsername, publicAuthorUrl } from "./catalog";

describe("public author catalog", () => {
  it("maps the editorial identity to one canonical public route", () => {
    expect(publicAuthorUrl("dora-ioakeimidou")).toBe("/dora-ioakeimidou");
    expect(publicAuthorByUsername("dora-ioakeimidou")?.displayName).toBe("Δώρα Ιωακειμίδου");
  });

  it("does not expose an unregistered staff identity", () => {
    expect(publicAuthorUrl("admin")).toBeNull();
  });
});
