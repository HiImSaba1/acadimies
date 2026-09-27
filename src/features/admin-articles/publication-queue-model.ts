export type PublicationQueueState = "upcoming" | "due" | "failed";

export function publicationQueueState(input: {
  scheduledFor: Date | null;
  updatedAt: Date;
  lastFailureAt?: Date;
  now: Date;
}): PublicationQueueState {
  if (input.lastFailureAt && input.lastFailureAt >= input.updatedAt) return "failed";
  return input.scheduledFor && input.scheduledFor <= input.now ? "due" : "upcoming";
}
