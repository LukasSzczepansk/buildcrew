import "server-only";

import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/lib/site-config";
import { DEFAULT_LOCALE, SITE_URL } from "@/lib/site-config";

const LOCALE_COOKIE = "buildcrew-locale";

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "en" || cookieLocale === "pl") return cookieLocale;
  return DEFAULT_LOCALE;
}

/** Keep the real request origin for localhost, OAuth callbacks and preview deployments. */
export async function getRequestOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host")?.split(",")[0]?.trim();
  if (!host) return SITE_URL;

  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}
