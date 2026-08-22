"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { portfolioImages, portfolioItems, profiles, projectMembers, projects } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit, isUuid } from "@/lib/security";

const WEBP_PREFIX = "data:image/webp;base64,";
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 475 * 1024;
const MAX_TOTAL_BYTES = 2.7 * 1024 * 1024;
const MAX_EDGE = 1800;
const MIN_EDGE = 120;

type PortfolioActionState = { ok?: true; error?: string };

type PortfolioImageInput = { dataUrl: string };

function readWebpDimensions(buffer: Buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16), height: 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16) };
  if (chunk === "VP8L") {
    const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
    return { width: 1 + (((b2 & 0x3f) << 8) | b1), height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)) };
  }
  if (chunk === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  return null;
}

function validateImage(input: PortfolioImageInput) {
  if (!input.dataUrl.startsWith(WEBP_PREFIX)) return { error: "Invalid image format." } as const;
  const base64 = input.dataUrl.slice(WEBP_PREFIX.length);
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) return { error: "Invalid image data." } as const;
  let bytes: Buffer;
  try { bytes = Buffer.from(base64, "base64"); } catch { return { error: "Could not read the image." } as const; }
  if (bytes.length < 256 || bytes.length > MAX_IMAGE_BYTES) return { error: "The processed portfolio image is too large or invalid." } as const;
  const dimensions = readWebpDimensions(bytes);
  if (!dimensions) return { error: "Could not verify the portfolio image." } as const;
  if (Math.min(dimensions.width, dimensions.height) < MIN_EDGE || Math.max(dimensions.width, dimensions.height) > MAX_EDGE) return { error: "Portfolio image dimensions are outside the allowed range." } as const;
  return { base64, byteSize: bytes.length, ...dimensions } as const;
}

async function revalidatePortfolio(userId: string) {
  const row = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  revalidatePath("/profile");
  revalidatePath(`/builders/${userId}`);
  if (row[0]?.username) revalidatePath(`/u/${row[0].username}`);
}

export async function createPortfolioItem(input: {
  title: string;
  description?: string;
  role?: string;
  tools?: string[];
  projectId?: string | null;
  images: PortfolioImageInput[];
}): Promise<PortfolioActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:portfolio:create", user.id, 12, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const title = input.title.trim().slice(0, 90);
  const description = input.description?.trim().slice(0, 1600) || null;
  const role = input.role?.trim().slice(0, 80) || null;
  const tools = [...new Set((input.tools ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, 12).map((item) => item.slice(0, 40));
  if (title.length < 2) return { error: "Add a portfolio title." };
  if (!input.images.length || input.images.length > MAX_IMAGES) return { error: `Add between 1 and ${MAX_IMAGES} portfolio images.` };

  let projectId: string | null = null;
  if (input.projectId) {
    if (!isUuid(input.projectId)) return { error: "Invalid project." };
    const accessible = await db
      .select({ id: projects.id })
      .from(projects)
      .leftJoin(projectMembers, and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, user.id)))
      .where(and(eq(projects.id, input.projectId), or(eq(projects.ownerId, user.id), eq(projectMembers.userId, user.id))))
      .limit(1);
    if (!accessible[0]) return { error: "You can only link portfolio work to a project you belong to." };
    projectId = input.projectId;
  }

  const validated = [] as { base64: string; byteSize: number; width: number; height: number }[];
  let total = 0;
  for (const image of input.images) {
    const parsed = validateImage(image);
    if ("error" in parsed) return { error: parsed.error };
    total += parsed.byteSize;
    validated.push(parsed);
  }
  if (total > MAX_TOTAL_BYTES) return { error: "The portfolio images are too large in total." };

  const itemId = crypto.randomUUID();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(portfolioItems).values({ id: itemId, userId: user.id, projectId, title, description, role, tools, createdAt: now, updatedAt: now });
    await tx.insert(portfolioImages).values(validated.map((image, sortOrder) => ({ itemId, sortOrder, mimeType: "image/webp", imageBase64: image.base64, byteSize: image.byteSize, width: image.width, height: image.height, createdAt: now })));
  });

  await logEvent("portfolio_item_created", user.id, { itemId, images: validated.length, totalBytes: total, projectId });
  await revalidatePortfolio(user.id);
  return { ok: true };
}

export async function deletePortfolioItem(itemId: string): Promise<PortfolioActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (!isUuid(itemId)) return { error: "Invalid portfolio item." };
  const removed = await db.delete(portfolioItems).where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.userId, user.id))).returning({ id: portfolioItems.id });
  if (!removed.length) return { error: "Portfolio item not found." };
  await logEvent("portfolio_item_removed", user.id, { itemId });
  await revalidatePortfolio(user.id);
  return { ok: true };
}
