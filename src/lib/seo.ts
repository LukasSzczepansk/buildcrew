export const SITE_NAME = "BuildCrew";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL_PL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://buildcreww.pl"
).replace(/\/$/, "");

export const DEFAULT_SEO_TITLE =
  "BuildCrew - projekty do portfolio i ludzie do wspólnego budowania";

export const DEFAULT_SEO_DESCRIPTION =
  "Znajdź ludzi do projektu, zbudujcie coś razem i twórz historię realnej współpracy. Projekty do portfolio, zespoły i sieć builderów w jednym miejscu.";

export function seoUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(value: string, max = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
