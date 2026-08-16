import type { MetadataRoute } from "next";
import { getRequestLocale } from "@/lib/site-server";
import { siteUrlForLocale } from "@/lib/site-config";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const locale = await getRequestLocale();
  const base = siteUrlForLocale(locale);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
