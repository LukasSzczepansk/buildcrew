import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/admin-verify",
  "/dashboard",
  "/messages",
  "/notifications",
  "/onboarding",
  "/profile",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // OpenAI's search crawler. Explicitly allow public BuildCrew pages so
        // they can be discovered, summarized and cited in ChatGPT Search.
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
