import { describe, expect, it } from "vitest";
import { isScheduledPublisherAuthorized, readScheduledPublisherSecret } from "./scheduler-auth";

describe("scheduled publisher authentication", () => {
  const secret = "a-secure-scheduler-token-with-32-characters";

  it("requires a dedicated secret of at least 32 characters", () => {
    expect(readScheduledPublisherSecret({})).toBeNull();
    expect(readScheduledPublisherSecret({ SCHEDULED_PUBLISH_SECRET: "too-short" })).toBeNull();
    expect(readScheduledPublisherSecret({ SCHEDULED_PUBLISH_SECRET: `  ${secret}  ` })).toBe(secret);
  });

  it("accepts only an exact bearer token", () => {
    expect(isScheduledPublisherAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(isScheduledPublisherAuthorized(`Bearer ${secret}-wrong`, secret)).toBe(false);
    expect(isScheduledPublisherAuthorized(secret, secret)).toBe(false);
    expect(isScheduledPublisherAuthorized(null, secret)).toBe(false);
  });
});
