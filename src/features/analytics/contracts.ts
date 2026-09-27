import { z } from "zod";

export const postViewInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{1,191}$/i),
}).strict();

export function postViewSessionKey(slug: string) {
  return `acadimies:post-view:${slug}`;
}
