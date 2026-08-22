import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { listProjectsForSitemap } from "@/server/data/projects";
import { listPublicProfilesForSitemap } from "@/server/data/network";
import { listLaunchesForSitemap } from "@/server/data/launches";

const DISCOVERY_PAGES = [
  "/znajdz/ludzi-do-projektu",
  "/znajdz/programiste-do-projektu",
  "/znajdz/ux-ui-designera-do-projektu",
  "/znajdz/cofoundera",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publicProfiles, launches] = await Promise.all([
    listProjectsForSitemap(),
    listPublicProfilesForSitemap(),
    listLaunchesForSitemap(),
  ]);

  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore/projects`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/launches`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...DISCOVERY_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    { url: `${SITE_URL}/sprint`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/sprint/regulamin`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    ...projects.map((project) => ({
      url: `${SITE_URL}/p/${project.id}`,
      lastModified: project.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...launches.map((launch) => ({
      url: `${SITE_URL}/launches/${launch.slug || launch.id}`,
      lastModified: launch.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.78,
    })),
    ...publicProfiles.map((profile) => ({
      url: `${SITE_URL}/u/${encodeURIComponent(profile.username)}`,
      lastModified: profile.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
