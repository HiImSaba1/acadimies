import { z } from "zod";

export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
  consent: z.literal("on"),
  website: z.string().max(0),
  source: z.enum(["homepage", "footer"]).default("homepage"),
});

export const campaignDraftSchema = z.object({
  title: z.string().trim().min(3).max(191),
  subject: z.string().trim().min(3).max(255),
  previewText: z.string().trim().max(320),
  body: z.string().trim().min(10).max(20_000),
});

export function parseNewsletterSignup(formData: FormData) {
  return newsletterSignupSchema.safeParse({ email: formData.get("email"), consent: formData.get("consent"), website: formData.get("website") ?? "", source: formData.get("source") ?? "homepage" });
}

export function parseCampaignDraft(formData: FormData) {
  return campaignDraftSchema.safeParse({ title: formData.get("title"), subject: formData.get("subject"), previewText: formData.get("previewText") ?? "", body: formData.get("body") });
}
