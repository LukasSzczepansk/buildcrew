export const SITE_NAME = "BuildCrew";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL_EN?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://buildcreww.com"
).replace(/\/$/, "");

export const DEFAULT_SEO_TITLE = "BuildCrew - find people to build projects with";

export const DEFAULT_SEO_DESCRIPTION =
  "Find developers, designers, founders and makers to build real projects with. Discover teams, join projects and build a track record of collaboration.";

export function seoUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(value: string, max = 158) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
