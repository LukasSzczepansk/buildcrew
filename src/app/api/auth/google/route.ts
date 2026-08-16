import { NextRequest, NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/email";
import { createGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "@/lib/google-oauth";
import { safeInternalRedirect, withNext } from "@/lib/redirects";

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent") === "signup" ? "signup" : "login";
  const fallback = intent === "signup" ? "/signup" : "/login";
  const rawNext = request.nextUrl.searchParams.get("next");
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "") : "";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(absoluteUrl(withNext(`${fallback}?google=not-configured`, nextPath), request.nextUrl.origin));
  }

  try {
    const authorizationUrl = await createGoogleAuthorizationUrl(intent, nextPath, request.nextUrl.origin);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google OAuth start failed", error);
    return NextResponse.redirect(absoluteUrl(withNext(`${fallback}?google=failed`, nextPath), request.nextUrl.origin));
  }
}
