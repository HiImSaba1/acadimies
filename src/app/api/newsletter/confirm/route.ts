import { NextResponse, type NextRequest } from "next/server";
import { confirmNewsletterSubscription } from "@/features/newsletter/repository";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const success = token && token.length >= 32 ? await confirmNewsletterSubscription(token) : false;
  return NextResponse.redirect(new URL(`/?newsletter=${success ? "confirmed" : "invalid"}#newsletter`, request.url), 303);
}
