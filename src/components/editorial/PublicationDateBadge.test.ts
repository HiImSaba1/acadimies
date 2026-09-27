import { describe, expect, it } from "vitest";
import { publicationDate } from "./PublicationDateBadge";

describe("publication date badge", () => {
  it("keeps every English month token to exactly three letters", () => {
    expect(publicationDate("2026-09-17T12:00:00.000Z")?.badgeMonth).toBe("Sep");
    expect(publicationDate("2026-06-17T12:00:00.000Z")?.badgeMonth).toBe("Jun");
  });

  it("rejects missing and invalid values", () => {
    expect(publicationDate(null)).toBeNull();
    expect(publicationDate("not-a-date")).toBeNull();
  });
});
