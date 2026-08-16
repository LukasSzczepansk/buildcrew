import "server-only";

import { cookies, headers } from "next/headers";
import { type AppLocale, localeFromHost, SITE_URL_EN, SITE_URL_PL } from "@/lib/site-config";

const LOCALE_COOKIE = "buildcrew-locale";

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const hostLocale = localeFromHost(host);
  if (hostLocale) return hostLocale;

  // Useful for localhost / preview deployments where the production domains are
  // not present in the Host header.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "en" || cookieLocale === "pl") return cookieLocale;

  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE === "en" ? "en" : "pl";
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host")?.split(",")[0]?.trim();
  if (!host) return (await getRequestLocale()) === "en" ? SITE_URL_EN : SITE_URL_PL;

  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}
