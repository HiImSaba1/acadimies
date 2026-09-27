import { describe, expect, it } from "vitest";
import { buildDoubleOptInMessage, newsletterOutcomeMessage, newsletterPublicOrigin } from "./confirmation-message";

const payload = { confirmationToken: "c".repeat(43), unsubscribeToken: "u".repeat(43), expiresAt: "2026-09-20T12:00:00.000Z" };

describe("newsletter confirmation delivery", () => {
  it("builds HTTPS confirmation and unsubscribe links without tracking", () => {
    const message = buildDoubleOptInMessage(payload);
    expect(message.text).toContain("https://acadimies.gr/api/newsletter/confirm?token=");
    expect(message.text).toContain("https://acadimies.gr/api/newsletter/unsubscribe?token=");
    expect(message.html).not.toContain("pixel");
  });

  it("rejects unsafe public origins while permitting local test URLs", () => {
    expect(() => newsletterPublicOrigin("http://acadimies.gr")).toThrow();
    expect(newsletterPublicOrigin("http://127.0.0.1:3107/path")).toBe("http://127.0.0.1:3107");
  });

  it("maps only known public outcomes", () => {
    expect(newsletterOutcomeMessage("confirmed")?.status).toBe("success");
    expect(newsletterOutcomeMessage("invalid")?.status).toBe("error");
    expect(newsletterOutcomeMessage("unknown")).toBeNull();
  });
});
