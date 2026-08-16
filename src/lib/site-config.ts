export type AppLocale = "en" | "pl";

/**
 * `pl` is kept in the type only for compatibility with persisted legacy data.
 * The product UI and public website are English-only.
 */
export const APP_LOCALES: readonly AppLocale[] = ["en"] as const;

function cleanUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

export const SITE_URL = cleanUrl(
  process.env.NEXT_PUBLIC_APP_URL_EN || process.env.NEXT_PUBLIC_APP_URL,
  "https://buildcreww.com",
);

/** Compatibility aliases used by older code. Both now resolve to the global site. */
export const SITE_URL_EN = SITE_URL;
export const SITE_URL_PL = SITE_URL;

export function siteUrlForLocale(_locale?: AppLocale) {
  return SITE_URL;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0]?.toLowerCase() || "";
  }
}

export const SITE_HOST_EN = hostnameFromUrl(SITE_URL);
export const SITE_HOST_PL = SITE_HOST_EN;

export function localeFromHost(_hostValue: string | null | undefined): AppLocale {
  return "en";
}

export function localeCode(_locale?: AppLocale) {
  return "en-US";
}

export function openGraphLocale(_locale?: AppLocale) {
  return "en_US";
}

export function pickLocale<T>(_locale: AppLocale, _pl: T, en: T): T {
  return en;
}

/**
 * Convert legacy Polish public aliases to the canonical English routes.
 */
export function pathForLocale(pathname: string, _locale?: AppLocale) {
  if (pathname === "/projekty" || pathname.startsWith("/projekty?")) return pathname.replace(/^\/projekty/, "/explore/projects");
  if (pathname === "/hackathony" || pathname.startsWith("/hackathony/")) return pathname.replace(/^\/hackathony/, "/explore/hackathons");
  if (pathname === "/terms") return "/terms";
  if (pathname === "/privacy") return "/privacy";
  return pathname;
}
