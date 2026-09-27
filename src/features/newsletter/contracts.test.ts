import { describe, expect, it } from "vitest";
import { parseCampaignDraft, parseNewsletterSignup } from "./contracts";

describe("newsletter contracts", () => {
  it("requires explicit consent and rejects the bot honeypot", () => {
    const valid = new FormData(); valid.set("email", " Reader@Example.GR "); valid.set("consent", "on"); valid.set("website", "");
    expect(parseNewsletterSignup(valid)).toMatchObject({ success: true, data: { email: "reader@example.gr" } });
    const missingConsent = new FormData(); missingConsent.set("email", "reader@example.gr"); missingConsent.set("website", "");
    expect(parseNewsletterSignup(missingConsent).success).toBe(false);
    valid.set("website", "https://spam.invalid");
    expect(parseNewsletterSignup(valid).success).toBe(false);
    const oversized = new FormData(); oversized.set("email", `${"a".repeat(181)}@example.gr`); oversized.set("consent", "on"); oversized.set("website", "");
    expect(parseNewsletterSignup(oversized).success).toBe(false);
  });

  it("accepts complete campaign drafts without authorizing delivery", () => {
    const form = new FormData(); form.set("title", "Golden Cup"); form.set("subject", "Μια νέα διοργάνωση"); form.set("previewText", "Νέα από τις ακαδημίες"); form.set("body", "Το πλήρες κείμενο της ενημέρωσης.");
    expect(parseCampaignDraft(form)).toMatchObject({ success: true, data: { title: "Golden Cup" } });
  });
});
