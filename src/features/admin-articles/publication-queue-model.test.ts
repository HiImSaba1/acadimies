import { describe, expect, it } from "vitest";
import { publicationQueueState } from "./publication-queue-model";

describe("publication queue state", () => {
  const now = new Date("2027-01-05T12:00:00Z");
  const updatedAt = new Date("2027-01-05T10:00:00Z");

  it("distinguishes upcoming and due publications", () => {
    expect(publicationQueueState({ scheduledFor: new Date("2027-01-05T13:00:00Z"), updatedAt, now })).toBe("upcoming");
    expect(publicationQueueState({ scheduledFor: new Date("2027-01-05T11:00:00Z"), updatedAt, now })).toBe("due");
  });

  it("keeps only a failure newer than the last edit actionable", () => {
    expect(publicationQueueState({ scheduledFor: new Date("2027-01-05T11:00:00Z"), updatedAt,
      lastFailureAt: new Date("2027-01-05T11:30:00Z"), now })).toBe("failed");
    expect(publicationQueueState({ scheduledFor: new Date("2027-01-05T13:00:00Z"), updatedAt,
      lastFailureAt: new Date("2027-01-05T09:00:00Z"), now })).toBe("upcoming");
  });
});
