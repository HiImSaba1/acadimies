import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeNewsletter } from "@/features/newsletter/repository";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const success = token && token.length >= 32 ? await unsubscribeNewsletter(token) : false;
  return NextResponse.redirect(new URL(`/?newsletter=${success ? "unsubscribed" : "invalid"}#newsletter`, request.url), 303);
}
