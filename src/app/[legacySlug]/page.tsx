import { notFound, permanentRedirect } from "next/navigation";
import { createPublicationRepository } from "@/features/publication/repositories";

export const revalidate = 300;

export default async function LegacyPostRedirect({ params }: { params: Promise<{ legacySlug: string }> }) {
  const { legacySlug } = await params;
  if (!/^[\p{L}\p{N}-]{1,191}$/u.test(legacySlug) || process.env.PUBLICATION_DATA_SOURCE !== "database") notFound();
  const post = await createPublicationRepository().findPublishedByLegacySlug(legacySlug);
  if (!post) notFound();
  permanentRedirect(`/posts/${post.slug}`);
}
