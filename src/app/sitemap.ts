import type { MetadataRoute } from "next";
import { getRequestLocale } from "@/lib/site-server";
import { siteUrlForLocale } from "@/lib/site-config";
import { listProjectsForSitemap } from "@/server/data/projects";
import { listPublicProfilesForSitemap } from "@/server/data/network";
import { listHackathonsForSitemap } from "@/server/data/hackathons";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = await getRequestLocale();
  const base = siteUrlForLocale(locale);
  const [projects, publicProfiles, hackathons] = await Promise.all([
    listProjectsForSitemap(),
    listPublicProfilesForSitemap(),
    listHackathonsForSitemap(),
  ]);
  const projectsPath = locale === "en" ? "/explore/projects" : "/projekty";
  const hackathonsPath = locale === "en" ? "/explore/hackathons" : "/hackathony";

  return [
    { url: base },
    { url: `${base}${projectsPath}` },
    { url: `${base}${hackathonsPath}` },
    ...hackathons.map((event) => ({ url: `${base}${hackathonsPath}/${event.slug}`, lastModified: event.updatedAt })),
    ...projects.map((project) => ({
      url: `${base}/p/${project.id}`,
      lastModified: project.updatedAt,
    })),
    ...publicProfiles.map((profile) => ({
      url: `${base}/u/${encodeURIComponent(profile.username)}`,
      lastModified: profile.updatedAt,
    })),
  ];
}
