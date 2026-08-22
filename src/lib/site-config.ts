export type AppLocale = "pl" | "en";

export const APP_LOCALES: readonly AppLocale[] = ["pl", "en"] as const;
export const DEFAULT_LOCALE: AppLocale = "pl";

function cleanUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

/** One canonical app/domain. Locale is a UI preference, not a separate site. */
export const SITE_URL = cleanUrl(
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL_EN,
  "https://buildcreww.pl",
);

export const SITE_URL_PL = SITE_URL;
export const SITE_URL_EN = SITE_URL;

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

export const SITE_HOST_PL = hostnameFromUrl(SITE_URL);
export const SITE_HOST_EN = SITE_HOST_PL;

/** Host no longer decides language. Both languages live on one canonical domain. */
export function localeFromHost(_hostValue: string | null | undefined): AppLocale | null {
  return null;
}

export function localeCode(locale: AppLocale = DEFAULT_LOCALE) {
  return locale === "en" ? "en-US" : "pl-PL";
}

export function openGraphLocale(locale: AppLocale = DEFAULT_LOCALE) {
  return locale === "en" ? "en_US" : "pl_PL";
}

export function pickLocale<T>(locale: AppLocale, pl: T, en: T): T {
  return locale === "en" ? en : pl;
}

/** Keep one route structure regardless of UI language. */
export function pathForLocale(pathname: string, _locale?: AppLocale) {
  if (pathname === "/projekty" || pathname.startsWith("/projekty?")) return pathname.replace(/^\/projekty/, "/explore/projects");
  if (pathname === "/hackathony" || pathname.startsWith("/hackathony/")) return pathname.replace(/^\/hackathony/, "/explore/hackathons");
  if (pathname === "/regulamin") return "/terms";
  if (pathname === "/polityka-prywatnosci") return "/privacy";
  return pathname;
}
