export const SITE_NAME = "BuildCrew";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL_EN?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://buildcreww.com"
).replace(/\/$/, "");

export const DEFAULT_SEO_TITLE = "BuildCrew - znajdź ludzi do projektu";

export const DEFAULT_SEO_DESCRIPTION =
  "Znajdź developerów, designerów i founderów do wspólnego projektu. Dołączaj do zespołów i buduj portfolio przez realną współpracę.";

export function seoUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(value: string, max = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
