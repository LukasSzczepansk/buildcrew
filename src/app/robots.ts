import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/admin-verify",
  "/build",
  "/builders",
  "/dashboard",
  "/feed",
  "/friends",
  "/ideas",
  "/invitations",
  "/jobs",
  "/messages",
  "/my-projects",
  "/network",
  "/notifications",
  "/onboarding",
  "/profile",
  "/projects",
  "/showcase",
  "/settings",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const publicRule = (userAgent: string) => ({ userAgent, allow: "/", disallow: PRIVATE_PATHS });

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      publicRule("OAI-SearchBot"),
      publicRule("Googlebot"),
      publicRule("Bingbot"),
      publicRule("*"),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
