import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { can } from "@/lib/auth/permissions";
import { searchAdminMedia } from "@/features/admin-articles/repository";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !can(session.user.role, "media:manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const parameters = new URL(request.url).searchParams;
  const search = parameters.get("q") ?? "";
  const offsetText = parameters.get("offset") ?? "0";
  if (search.length > 80 || !/^\d{1,6}$/.test(offsetText)) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const results = await searchAdminMedia({ search, offset: Number(offsetText), limit: 24 });
    return NextResponse.json(results, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Media search unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
