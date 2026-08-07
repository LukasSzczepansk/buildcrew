import { NextRequest, NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/email";
import { createGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent") === "signup" ? "signup" : "login";
  const fallback = intent === "signup" ? "/signup" : "/login";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(absoluteUrl(`${fallback}?google=not-configured`));
  }

  try {
    const authorizationUrl = await createGoogleAuthorizationUrl(intent);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google OAuth start failed", error);
    return NextResponse.redirect(absoluteUrl(`${fallback}?google=failed`));
  }
}
