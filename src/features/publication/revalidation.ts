import "server-only";
import { revalidateTag } from "next/cache";
import { affectedPublicationTags } from "./cache-tags";

export function revalidatePublication(input: {
  postSlug: string;
  categorySlugs?: string[];
}): void {
  for (const tag of affectedPublicationTags(input)) {
    revalidateTag(tag, "max");
  }
}
