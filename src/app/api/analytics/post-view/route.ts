import { NextResponse } from "next/server";
import { postViewInputSchema } from "@/features/analytics/contracts";
import { createPublicationRepository } from "@/features/publication/repositories";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 512) return NextResponse.json({ recorded: false }, { status: 413 });
  const input = postViewInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ recorded: false }, { status: 400 });
  const recorded = await createPublicationRepository().recordPublishedView(input.data.slug);
  return NextResponse.json({ recorded }, { status: recorded ? 202 : 404 });
}
