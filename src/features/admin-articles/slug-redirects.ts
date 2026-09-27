export function needsPublishedSlugRedirect(currentStatus: string, currentSlug: string, nextSlug: string) {
  return currentStatus === "published" && currentSlug !== nextSlug;
}

export function assertRedirectOwnership(redirectPostId: string | null | undefined, articleId: string) {
  if (redirectPostId && redirectPostId !== articleId) throw new Error("ARTICLE_REDIRECT_COLLISION");
  return redirectPostId === articleId;
}
