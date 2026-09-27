import { NextResponse, type NextRequest } from "next/server";
import { revalidatePublication } from "@/features/publication/revalidation";
import { isScheduledPublisherAuthorized, readScheduledPublisherSecret } from "@/features/admin-articles/scheduler-auth";
import { publishDueScheduledPublications } from "@/features/admin-articles/scheduled-publisher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = readScheduledPublisherSecret();
  const headers = { "Cache-Control": "private, no-store" };
  if (!secret) return NextResponse.json({ error: "Scheduler unavailable" }, { status: 503, headers });
  if (!isScheduledPublisherAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    const result = await publishDueScheduledPublications();
    for (const article of result.published) {
      revalidatePublication({ postSlug: article.slug, categorySlugs: article.categorySlugs });
    }
    return NextResponse.json({ checked: result.checked, published: result.published.length, failed: result.failed }, { headers });
  } catch {
    return NextResponse.json({ error: "Scheduled publishing failed" }, { status: 500, headers });
  }
}
