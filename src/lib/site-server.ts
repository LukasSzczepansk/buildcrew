import "server-only";

import { headers } from "next/headers";
import type { AppLocale } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-config";

/** BuildCrew is now an English-only product. */
export async function getRequestLocale(): Promise<AppLocale> {
  return "en";
}

/**
 * Keep the real request origin for localhost, OAuth callbacks and preview
 * deployments. Public links use SITE_URL through siteUrlForLocale().
 */
export async function getRequestOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host")?.split(",")[0]?.trim();
  if (!host) return SITE_URL;

  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}
