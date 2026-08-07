import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/email";

export type GoogleAuthIntent = "login" | "signup";

const STATE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_google_state" : "buildcrew_google_state";
const VERIFIER_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_google_verifier" : "buildcrew_google_verifier";
const INTENT_COOKIE = process.env.NODE_ENV === "production" ? "__Host-buildcrew_google_intent" : "buildcrew_google_intent";
const OAUTH_TTL_SECONDS = 10 * 60;

function base64UrlSha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

function secureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // __Host- cookies are accepted by browsers only with Path=/ and no Domain.
    path: "/",
    maxAge: OAUTH_TTL_SECONDS,
  };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function googleRedirectUri() {
  return absoluteUrl("/api/auth/google/callback");
}

export async function createGoogleAuthorizationUrl(intent: GoogleAuthIntent) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    throw new Error("Google OAuth is not configured");
  }

  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = base64UrlSha256(verifier);
  const cookieStore = await cookies();
  const options = secureCookieOptions();

  cookieStore.set(STATE_COOKIE, state, options);
  cookieStore.set(VERIFIER_COOKIE, verifier, options);
  cookieStore.set(INTENT_COOKIE, intent, options);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function consumeGoogleOAuthContext(receivedState: string | null) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value ?? null;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value ?? null;
  const rawIntent = cookieStore.get(INTENT_COOKIE)?.value;

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(VERIFIER_COOKIE);
  cookieStore.delete(INTENT_COOKIE);

  if (!receivedState || !expectedState || !verifier) return null;
  const received = Buffer.from(receivedState);
  const expected = Buffer.from(expectedState);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  return {
    verifier,
    intent: rawIntent === "signup" ? "signup" as const : "login" as const,
  };
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: googleRedirectUri(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Google token exchange failed", response.status, await response.text());
    return null;
  }

  const payload = await response.json() as { access_token?: string };
  return payload.access_token?.trim() || null;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Google userinfo failed", response.status, await response.text());
    return null;
  }

  const payload = await response.json() as Partial<GoogleUserInfo>;
  if (!payload.sub || !payload.email || payload.email_verified !== true) return null;

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    email_verified: true,
    name: payload.name,
    picture: payload.picture,
  };
}
