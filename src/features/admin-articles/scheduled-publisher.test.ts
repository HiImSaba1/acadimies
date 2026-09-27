import { describe, expect, it } from "vitest";
import { scheduledPublicationLimit } from "./scheduler-auth";

describe("scheduled publication bounds", () => {
  it("uses a conservative default and enforces hard limits", () => {
    expect(scheduledPublicationLimit(undefined)).toBe(25);
    expect(scheduledPublicationLimit("0")).toBe(1);
    expect(scheduledPublicationLimit("20")).toBe(20);
    expect(scheduledPublicationLimit("500")).toBe(100);
    expect(scheduledPublicationLimit("invalid")).toBe(25);
  });
});
