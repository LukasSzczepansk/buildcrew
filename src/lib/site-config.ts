export type AppLocale = "pl" | "en";

export const APP_LOCALES: readonly AppLocale[] = ["pl", "en"] as const;

function cleanUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

export const SITE_URL_PL = cleanUrl(
  process.env.NEXT_PUBLIC_APP_URL_PL || process.env.NEXT_PUBLIC_APP_URL,
  "https://buildcreww.pl",
);

export const SITE_URL_EN = cleanUrl(
  process.env.NEXT_PUBLIC_APP_URL_EN,
  "https://buildcreww.com",
);

export function siteUrlForLocale(locale: AppLocale) {
  return locale === "en" ? SITE_URL_EN : SITE_URL_PL;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0]?.toLowerCase() || "";
  }
}

export const SITE_HOST_PL = hostnameFromUrl(SITE_URL_PL);
export const SITE_HOST_EN = hostnameFromUrl(SITE_URL_EN);

export function localeFromHost(hostValue: string | null | undefined): AppLocale | null {
  const host = (hostValue || "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
  if (!host) return null;
  if (host === SITE_HOST_EN || host.endsWith(`.${SITE_HOST_EN}`)) return "en";
  if (host === SITE_HOST_PL || host.endsWith(`.${SITE_HOST_PL}`)) return "pl";
  return null;
}

export function localeCode(locale: AppLocale) {
  return locale === "en" ? "en-US" : "pl-PL";
}

export function openGraphLocale(locale: AppLocale) {
  return locale === "en" ? "en_US" : "pl_PL";
}

export function pickLocale<T>(locale: AppLocale, pl: T, en: T): T {
  return locale === "en" ? en : pl;
}

/**
 * Public Polish routes predate the international version. Keep them working on
 * .pl, while the .com language switch points to neutral English aliases.
 */
export function pathForLocale(pathname: string, locale: AppLocale) {
  if (locale === "en") {
    if (pathname === "/projekty" || pathname.startsWith("/projekty?")) return pathname.replace(/^\/projekty/, "/explore/projects");
    if (pathname === "/hackathony" || pathname.startsWith("/hackathony/")) return pathname.replace(/^\/hackathony/, "/explore/hackathons");
    if (pathname === "/regulamin") return "/terms";
    if (pathname === "/polityka-prywatnosci") return "/privacy";
    return pathname;
  }

  if (pathname === "/explore/projects" || pathname.startsWith("/explore/projects?")) return pathname.replace(/^\/explore\/projects/, "/projekty");
  if (pathname === "/explore/hackathons" || pathname.startsWith("/explore/hackathons/")) return pathname.replace(/^\/explore\/hackathons/, "/hackathony");
  if (pathname === "/terms") return "/regulamin";
  if (pathname === "/privacy") return "/polityka-prywatnosci";
  return pathname;
}
