import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listProjectsForSitemap } from "@/server/data/projects";
import { listPublicProfilesForSitemap } from "@/server/data/network";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publicProfiles] = await Promise.all([listProjectsForSitemap(), listPublicProfilesForSitemap()]);

  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/projekty` },
    ...projects.map((project) => ({
      url: `${SITE_URL}/p/${project.id}`,
      lastModified: project.updatedAt,
    })),
    ...publicProfiles.map((profile) => ({
      url: `${SITE_URL}/u/${encodeURIComponent(profile.username)}`,
      lastModified: profile.updatedAt,
    })),
  ];
}
