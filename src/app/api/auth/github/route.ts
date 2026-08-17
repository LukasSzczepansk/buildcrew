import { NextRequest, NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/email";
import { createGitHubAuthorizationUrl, isGitHubOAuthConfigured } from "@/lib/github-oauth";
import { safeInternalRedirect, withNext } from "@/lib/redirects";

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent") === "signup" ? "signup" : "login";
  const fallback = intent === "signup" ? "/signup" : "/login";
  const rawNext = request.nextUrl.searchParams.get("next");
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "") : "";

  if (!isGitHubOAuthConfigured()) {
    return NextResponse.redirect(absoluteUrl(withNext(`${fallback}?github=not-configured`, nextPath), request.nextUrl.origin));
  }

  try {
    const authorizationUrl = await createGitHubAuthorizationUrl(intent, nextPath, request.nextUrl.origin);
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("GitHub OAuth start failed", error);
    return NextResponse.redirect(absoluteUrl(withNext(`${fallback}?github=failed`, nextPath), request.nextUrl.origin));
  }
}
