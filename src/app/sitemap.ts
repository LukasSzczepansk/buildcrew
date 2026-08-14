import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listProjectsForSitemap } from "@/server/data/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await listProjectsForSitemap();

  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/projekty` },
    ...projects.map((project) => ({
      url: `${SITE_URL}/p/${project.id}`,
      lastModified: project.updatedAt,
    })),
  ];
}
