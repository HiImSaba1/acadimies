import { describe, expect, it } from "vitest";
import { parseContactSubmission } from "./contracts";

function validSubmission() {
  const formData = new FormData();
  formData.set("name", "Δώρα Ιωακειμίδου");
  formData.set("email", " Writer@Example.gr ");
  formData.set("submissionType", "ARTICLE_IDEA");
  formData.set("contributionType", "OPINION");
  formData.set("proposedTitle", "Η εξέλιξη μιας ακαδημίας");
  formData.set("message", "Αυτή είναι μια ολοκληρωμένη πρόταση άρθρου με αρκετές πληροφορίες για αξιολόγηση.");
  formData.set("consent", "on");
  formData.set("website", "");
  return formData;
}

describe("contact submission", () => {
  it("normalizes a valid editorial proposal", () => {
    expect(parseContactSubmission(validSubmission())).toMatchObject({
      success: true,
      data: { email: "writer@example.gr", submissionType: "ARTICLE_IDEA", contributionType: "OPINION" },
    });
  });

  it("accepts a simple message without article fields", () => {
    const formData = validSubmission();
    formData.set("submissionType", "MESSAGE");
    formData.delete("contributionType");
    formData.delete("proposedTitle");
    expect(parseContactSubmission(formData)).toMatchObject({
      success: true,
      data: { email: "writer@example.gr", submissionType: "MESSAGE" },
    });
  });

  it("rejects bots, missing consent, and short messages", () => {
    const bot = validSubmission();
    bot.set("website", "https://spam.example");
    expect(parseContactSubmission(bot).success).toBe(false);

    const incomplete = validSubmission();
    incomplete.delete("consent");
    incomplete.set("message", "Πολύ μικρό");
    expect(parseContactSubmission(incomplete).success).toBe(false);
  });
});
