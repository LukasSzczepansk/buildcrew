import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { listProjectsForSitemap } from "@/server/data/projects";
import { listPublicProfilesForSitemap } from "@/server/data/network";
import { listHackathonsForSitemap } from "@/server/data/hackathons";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publicProfiles, hackathons] = await Promise.all([
    listProjectsForSitemap(),
    listPublicProfilesForSitemap(),
    listHackathonsForSitemap(),
  ]);

  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/explore/projects` },
    { url: `${SITE_URL}/explore/hackathons` },
    { url: `${SITE_URL}/terms` },
    { url: `${SITE_URL}/privacy` },
    ...hackathons.map((event) => ({ url: `${SITE_URL}/explore/hackathons/${event.slug}`, lastModified: event.updatedAt })),
    ...projects.map((project) => ({ url: `${SITE_URL}/p/${project.id}`, lastModified: project.updatedAt })),
    ...publicProfiles.map((profile) => ({ url: `${SITE_URL}/u/${encodeURIComponent(profile.username)}`, lastModified: profile.updatedAt })),
  ];
}
