import { z } from "zod";

export const articleDocumentSchema = z.object({
  dek: z.string().max(600),
  blocks: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("paragraph"), text: z.string() }),
    z.object({ type: z.literal("heading"), text: z.string() }),
    z.object({ type: z.literal("quote"), text: z.string(), attribution: z.string().optional() }),
    z.object({ type: z.literal("score"), home: z.string(), away: z.string(), homeScore: z.number(), awayScore: z.number(), minute: z.string() }),
    z.object({ type: z.literal("question"), question: z.string(), answer: z.string() }),
    z.object({ type: z.literal("cta"), label: z.string().min(1).max(120), href: z.string().min(1).max(2048) }),
    z.object({ type: z.literal("image"), mediaId: z.string(), alt: z.string().min(1), caption: z.string().optional() }),
    z.object({ type: z.literal("chapter"), heading: z.string(), text: z.string(), mediaId: z.string(), alt: z.string().min(1), imageSide: z.enum(["left", "right"]) }),
  ])).min(1),
});
export type ArticleDocument = z.infer<typeof articleDocumentSchema>;
