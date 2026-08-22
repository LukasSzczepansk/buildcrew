import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { listProjectsForSitemap } from "@/server/data/projects";
import { listPublicProfilesForSitemap } from "@/server/data/network";
import { listLaunchesForSitemap } from "@/server/data/launches";

const STATIC_PUBLIC_PAGES = [
  ["/", 1, "daily"],
  ["/projekty", 0.9, "daily"],
  ["/launches", 0.85, "daily"],
  ["/znajdz-programiste", 0.9, "weekly"],
  ["/znajdz-designera", 0.9, "weekly"],
  ["/znajdz-marketera", 0.75, "weekly"],
  ["/znajdz-wspolnika", 0.85, "weekly"],
  ["/znajdz-zespol", 0.9, "weekly"],
  ["/dolacz-do-projektu", 0.85, "weekly"],
  ["/dla-programistow", 0.8, "weekly"],
  ["/dla-designerow", 0.8, "weekly"],
  ["/platforma-do-wspolnych-projektow", 0.9, "weekly"],
  ["/znajdz/ludzi-do-projektu", 0.85, "weekly"],
  ["/znajdz/programiste-do-projektu", 0.8, "weekly"],
  ["/znajdz/ux-ui-designera-do-projektu", 0.8, "weekly"],
  ["/znajdz/cofoundera", 0.8, "weekly"],
  ["/poradniki", 0.75, "weekly"],
  ["/poradniki/jak-znalezc-programiste-do-projektu", 0.75, "monthly"],
  ["/poradniki/jak-znalezc-designera-do-startupu", 0.75, "monthly"],
  ["/poradniki/jak-zbudowac-zespol-do-projektu", 0.75, "monthly"],
  ["/o-nas", 0.6, "monthly"],
  ["/terms", 0.1, "yearly"],
  ["/privacy", 0.1, "yearly"],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publicProfiles, launches] = await Promise.all([
    listProjectsForSitemap(),
    listPublicProfilesForSitemap(),
    listLaunchesForSitemap(),
  ]);
  const now = new Date();
  return [
    ...STATIC_PUBLIC_PAGES.map(([path, priority, changeFrequency]) => ({ url: `${SITE_URL}${path === "/" ? "" : path}`, lastModified: now, changeFrequency, priority })),
    ...projects.map((project) => ({ url: `${SITE_URL}/p/${project.id}`, lastModified: project.updatedAt, changeFrequency: "weekly" as const, priority: 0.75 })),
    ...publicProfiles.map((profile) => ({ url: `${SITE_URL}/u/${encodeURIComponent(profile.username)}`, lastModified: profile.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...launches.map((launch) => ({ url: `${SITE_URL}/launches/${encodeURIComponent(launch.slug || launch.id)}`, lastModified: launch.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
