import { z } from "zod";

const contactBaseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(191),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(30).max(5_000),
  consent: z.boolean().refine((value) => value, "Consent is required"),
  website: z.string().trim().max(0),
});

export const simpleContactSchema = contactBaseSchema.extend({
  submissionType: z.literal("MESSAGE"),
});

export const editorialProposalSchema = contactBaseSchema.extend({
  submissionType: z.literal("ARTICLE_IDEA"),
  contributionType: z.enum(["NEWS", "OPINION", "INTERVIEW", "EVENT", "OTHER"]),
  proposedTitle: z.string().trim().min(3).max(200),
});

export const contactSubmissionSchema = z.discriminatedUnion("submissionType", [
  simpleContactSchema,
  editorialProposalSchema,
]);

export function parseContactSubmission(formData: FormData) {
  return contactSubmissionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    submissionType: formData.get("submissionType"),
    contributionType: formData.get("contributionType"),
    phone: formData.get("phone") || undefined,
    proposedTitle: formData.get("proposedTitle") || undefined,
    message: formData.get("message"),
    consent: formData.get("consent") === "on",
    website: formData.get("website") ?? "",
  });
}
