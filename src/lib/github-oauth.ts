import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/email";
import { safeInternalRedirect } from "@/lib/redirects";

export type GitHubAuthIntent = "login" | "signup";

const STATE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_github_state" : "buildcrew_github_state";
const VERIFIER_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_github_verifier" : "buildcrew_github_verifier";
const INTENT_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_github_intent" : "buildcrew_github_intent";
const NEXT_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_github_next" : "buildcrew_github_next";
const OAUTH_TTL_SECONDS = 10 * 60;

function base64UrlSha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

function secureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_TTL_SECONDS,
  };
}

export function isGitHubOAuthConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim());
}

export function githubRedirectUri(origin?: string) {
  return absoluteUrl("/api/auth/github/callback", origin);
}

export async function createGitHubAuthorizationUrl(intent: GitHubAuthIntent, nextPath?: string | null, origin?: string) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET?.trim()) throw new Error("GitHub OAuth is not configured");

  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = base64UrlSha256(verifier);
  const cookieStore = await cookies();
  const options = secureCookieOptions();

  cookieStore.set(STATE_COOKIE, state, options);
  cookieStore.set(VERIFIER_COOKIE, verifier, options);
  cookieStore.set(INTENT_COOKIE, intent, options);
  const safeNext = nextPath ? safeInternalRedirect(nextPath, "") : "";
  if (safeNext) cookieStore.set(NEXT_COOKIE, safeNext, options);
  else cookieStore.delete(NEXT_COOKIE);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", githubRedirectUri(origin));
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url;
}

export async function consumeGitHubOAuthContext(receivedState: string | null) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value ?? null;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value ?? null;
  const rawIntent = cookieStore.get(INTENT_COOKIE)?.value;
  const rawNext = cookieStore.get(NEXT_COOKIE)?.value;

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(VERIFIER_COOKIE);
  cookieStore.delete(INTENT_COOKIE);
  cookieStore.delete(NEXT_COOKIE);

  if (!receivedState || !expectedState || !verifier) return null;
  const received = Buffer.from(receivedState);
  const expected = Buffer.from(expectedState);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  return {
    verifier,
    intent: rawIntent === "signup" ? "signup" as const : "login" as const,
    nextPath: rawNext ? safeInternalRedirect(rawNext, "") : "",
  };
}

export async function exchangeGitHubCode(code: string, verifier: string, origin?: string) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth is not configured");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: githubRedirectUri(origin),
      code_verifier: verifier,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("GitHub token exchange failed", response.status, await response.text());
    return null;
  }

  const payload = await response.json() as { access_token?: string; error?: string };
  if (payload.error) {
    console.error("GitHub token exchange returned error", payload.error);
    return null;
  }
  return payload.access_token?.trim() || null;
}

export type GitHubUserInfo = {
  id: string;
  login: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  profileUrl: string;
};

export async function fetchGitHubUserInfo(accessToken: string): Promise<GitHubUserInfo | null> {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "BuildCrew",
  };

  const userResponse = await fetch("https://api.github.com/user", { headers, cache: "no-store" });
  if (!userResponse.ok) {
    console.error("GitHub user request failed", userResponse.status, await userResponse.text());
    return null;
  }

  const user = await userResponse.json() as {
    id?: number;
    login?: string;
    email?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    html_url?: string | null;
  };
  if (!user.id || !user.login) return null;

  let email = user.email?.trim().toLowerCase() || "";
  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", { headers, cache: "no-store" });
    if (!emailResponse.ok) {
      console.error("GitHub email request failed", emailResponse.status, await emailResponse.text());
      return null;
    }
    const emails = await emailResponse.json() as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
    const selected = emails.find((item) => item.primary && item.verified && item.email)
      ?? emails.find((item) => item.verified && item.email);
    email = selected?.email?.trim().toLowerCase() || "";
  }
  if (!email) return null;

  return {
    id: String(user.id),
    login: user.login,
    email,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url || `https://github.com/${encodeURIComponent(user.login)}`,
  };
}
