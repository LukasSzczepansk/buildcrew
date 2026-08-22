import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { portfolioImages, portfolioItems, profiles, projects } from "@/db/schema";
import { isUuid } from "@/lib/security";

export type PortfolioViewItem = {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  tools: string[];
  projectId: string | null;
  projectName: string | null;
  updatedAt: Date;
  images: { id: string; width: number; height: number; sortOrder: number }[];
};

export async function listPortfolioForUser(userId: string): Promise<PortfolioViewItem[]> {
  if (!isUuid(userId)) return [];
  const items = await db
    .select({
      id: portfolioItems.id,
      title: portfolioItems.title,
      description: portfolioItems.description,
      role: portfolioItems.role,
      tools: portfolioItems.tools,
      projectId: portfolioItems.projectId,
      projectName: projects.name,
      updatedAt: portfolioItems.updatedAt,
    })
    .from(portfolioItems)
    .leftJoin(projects, eq(projects.id, portfolioItems.projectId))
    .where(eq(portfolioItems.userId, userId))
    .orderBy(desc(portfolioItems.updatedAt));

  if (!items.length) return [];
  const images = await db
    .select({ id: portfolioImages.id, itemId: portfolioImages.itemId, width: portfolioImages.width, height: portfolioImages.height, sortOrder: portfolioImages.sortOrder })
    .from(portfolioImages)
    .where(inArray(portfolioImages.itemId, items.map((item) => item.id)))
    .orderBy(asc(portfolioImages.sortOrder));

  const byItem = new Map<string, typeof images>();
  for (const image of images) {
    const list = byItem.get(image.itemId) ?? [];
    list.push(image);
    byItem.set(image.itemId, list);
  }

  return items.map((item) => ({
    ...item,
    images: (byItem.get(item.id) ?? []).map(({ id, width, height, sortOrder }) => ({ id, width, height, sortOrder })),
  }));
}

export async function getPortfolioImage(imageId: string) {
  if (!isUuid(imageId)) return null;
  const rows = await db
    .select({
      id: portfolioImages.id,
      mimeType: portfolioImages.mimeType,
      imageBase64: portfolioImages.imageBase64,
      itemId: portfolioImages.itemId,
      ownerId: portfolioItems.userId,
      publicProfile: profiles.publicProfile,
    })
    .from(portfolioImages)
    .innerJoin(portfolioItems, eq(portfolioItems.id, portfolioImages.itemId))
    .innerJoin(profiles, eq(profiles.userId, portfolioItems.userId))
    .where(eq(portfolioImages.id, imageId))
    .limit(1);
  return rows[0] ?? null;
}
