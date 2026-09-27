"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/auth/session";
import { cancelScheduledPublication } from "./publication-queue";

export async function cancelScheduledPublicationAction(formData: FormData) {
  const session = await requireCapability("article:publish");
  const articleId = String(formData.get("articleId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(articleId)) redirect("/admin/publication-queue?cancelled=0");
  const cancelled = await cancelScheduledPublication(articleId, session.user.id);
  revalidatePath("/admin/publication-queue");
  revalidatePath("/admin/articles");
  redirect(`/admin/publication-queue?cancelled=${cancelled ? "1" : "0"}`);
}
