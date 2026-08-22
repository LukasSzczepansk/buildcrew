"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  profiles,
  projectMembers,
  projects,
  showcaseComments,
  showcaseEntries,
  showcaseImages,
  showcaseReactions,
  socialPosts,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { launchCommentSchema, launchInputSchema } from "@/lib/launch-validations";
import { makeLaunchSlug } from "@/lib/launches";
import { enforceUserRateLimit, isUuid } from "@/lib/security";
import { getRequestLocale } from "@/lib/site-server";
import { createNotification } from "@/server/services/notifications";

const WEBP_PREFIX = "data:image/webp;base64,";
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 475 * 1024;
const MAX_TOTAL_BYTES = 2.25 * 1024 * 1024;
const MAX_EDGE = 1800;
const MIN_EDGE = 120;

type LaunchImageInput = { dataUrl: string };
type LaunchActionInput = {
  projectId?: string;
  title: string;
  tagline: string;
  description: string;
  websiteUrl?: string;
  githubUrl?: string;
  category: string;
  status: string;
  technologies?: string[];
  needs?: string[];
  images?: LaunchImageInput[];
  replaceImages?: boolean;
};

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

function validateImage(input: LaunchImageInput) {
  if (!input.dataUrl.startsWith(WEBP_PREFIX)) return { error: "Nieprawidłowy format obrazu." } as const;
  const base64 = input.dataUrl.slice(WEBP_PREFIX.length);
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) return { error: "Nieprawidłowe dane obrazu." } as const;
  let bytes: Buffer;
  try { bytes = Buffer.from(base64, "base64"); } catch { return { error: "Nie udało się odczytać obrazu." } as const; }
  if (bytes.length < 256 || bytes.length > MAX_IMAGE_BYTES) return { error: "Obraz po kompresji jest zbyt duży lub nieprawidłowy." } as const;
  const dimensions = readWebpDimensions(bytes);
  if (!dimensions) return { error: "Nie udało się zweryfikować obrazu." } as const;
  if (Math.min(dimensions.width, dimensions.height) < MIN_EDGE || Math.max(dimensions.width, dimensions.height) > MAX_EDGE) return { error: "Wymiary obrazu są poza dozwolonym zakresem." } as const;
  return { base64, byteSize: bytes.length, ...dimensions } as const;
}

async function projectForLaunch(userId: string, projectId?: string) {
  if (!projectId) return null;
  if (!isUuid(projectId)) return undefined;
  const rows = await db.select({ id: projects.id, crewId: projects.crewId })
    .from(projects)
    .leftJoin(projectMembers, and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)))
    .where(and(eq(projects.id, projectId), or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId))))
    .limit(1);
  return rows[0];
}

function cleanTechnologies(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].slice(0, 12).map((item) => item.slice(0, 40));
}

function validateImages(images: LaunchImageInput[]) {
  if (images.length > MAX_IMAGES) return { error: `Możesz dodać maksymalnie ${MAX_IMAGES} screenshotów.` } as const;
  const validated: { base64: string; byteSize: number; width: number; height: number }[] = [];
  let total = 0;
  for (const image of images) {
    const parsed = validateImage(image);
    if ("error" in parsed) return parsed;
    total += parsed.byteSize;
    validated.push(parsed);
  }
  if (total > MAX_TOTAL_BYTES) return { error: "Screenshoty są łącznie zbyt duże." } as const;
  return { images: validated } as const;
}

async function revalidateLaunch(slug: string, creatorId?: string) {
  revalidatePath("/launches");
  revalidatePath(`/launches/${slug}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  if (creatorId) {
    revalidatePath("/profile");
    revalidatePath(`/builders/${creatorId}`);
    const profile = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, creatorId)).limit(1);
    if (profile[0]?.username) revalidatePath(`/u/${profile[0].username}`);
  }
}

export async function createLaunch(input: LaunchActionInput) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to show a project." : "Zaloguj się, aby pokazać projekt." };
  const rateError = await enforceUserRateLimit("action:launch:create", user.id, 6, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = launchInputSchema.safeParse({ ...input, technologies: cleanTechnologies(input.technologies ?? []) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? (en ? "Check the form." : "Sprawdź formularz.") };
  const project = await projectForLaunch(user.id, parsed.data.projectId || undefined);
  if (parsed.data.projectId && !project) return { error: en ? "You can only use a project you belong to." : "Możesz wybrać tylko projekt, do którego należysz." };

  const checkedImages = validateImages(input.images ?? []);
  if ("error" in checkedImages) return { error: checkedImages.error };

  const id = crypto.randomUUID();
  const slug = makeLaunchSlug(parsed.data.title, id);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(showcaseEntries).values({
      id,
      creatorId: user.id,
      projectId: parsed.data.projectId || null,
      crewId: project?.crewId ?? null,
      slug,
      title: parsed.data.title,
      tagline: parsed.data.tagline,
      description: parsed.data.description,
      liveUrl: parsed.data.websiteUrl || null,
      githubUrl: parsed.data.githubUrl || null,
      category: parsed.data.category,
      status: parsed.data.status,
      technologies: parsed.data.technologies,
      needs: parsed.data.needs,
      lookingForCollaborators: parsed.data.needs.includes("TEAM"),
      createdAt: now,
      updatedAt: now,
    });
    if (checkedImages.images.length) {
      await tx.insert(showcaseImages).values(checkedImages.images.map((image, sortOrder) => ({ entryId: id, sortOrder, mimeType: "image/webp", imageBase64: image.base64, byteSize: image.byteSize, width: image.width, height: image.height, createdAt: now })));
    }
    await tx.insert(socialPosts).values({ authorId: user.id, kind: "LAUNCH", projectId: parsed.data.projectId || null, launchId: id, body: `${parsed.data.title} - ${parsed.data.tagline}`.slice(0, 800), createdAt: now });
  });

  await revalidateLaunch(slug, user.id);
  return { success: true, slug } as const;
}

export async function updateLaunch(entryId: string, input: LaunchActionInput) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to edit this project." : "Zaloguj się, aby edytować projekt." };
  if (!isUuid(entryId)) return { error: en ? "Invalid project." : "Nieprawidłowy projekt." };
  const own = await db.select({ creatorId: showcaseEntries.creatorId, slug: showcaseEntries.slug }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  if (!own[0] || own[0].creatorId !== user.id) return { error: en ? "You cannot edit this launch." : "Nie możesz edytować tej premiery." };

  const parsed = launchInputSchema.safeParse({ ...input, technologies: cleanTechnologies(input.technologies ?? []) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? (en ? "Check the form." : "Sprawdź formularz.") };
  const project = await projectForLaunch(user.id, parsed.data.projectId || undefined);
  if (parsed.data.projectId && !project) return { error: en ? "You can only use a project you belong to." : "Możesz wybrać tylko projekt, do którego należysz." };

  const checkedImages = input.replaceImages ? validateImages(input.images ?? []) : { images: [] as { base64: string; byteSize: number; width: number; height: number }[] };
  if ("error" in checkedImages) return { error: checkedImages.error };
  await db.transaction(async (tx) => {
    await tx.update(showcaseEntries).set({
      projectId: parsed.data.projectId || null,
      crewId: project?.crewId ?? null,
      title: parsed.data.title,
      tagline: parsed.data.tagline,
      description: parsed.data.description,
      liveUrl: parsed.data.websiteUrl || null,
      githubUrl: parsed.data.githubUrl || null,
      category: parsed.data.category,
      status: parsed.data.status,
      technologies: parsed.data.technologies,
      needs: parsed.data.needs,
      lookingForCollaborators: parsed.data.needs.includes("TEAM"),
      updatedAt: new Date(),
    }).where(eq(showcaseEntries.id, entryId));
    if (input.replaceImages) {
      await tx.delete(showcaseImages).where(eq(showcaseImages.entryId, entryId));
      if (checkedImages.images.length) await tx.insert(showcaseImages).values(checkedImages.images.map((image, sortOrder) => ({ entryId, sortOrder, mimeType: "image/webp", imageBase64: image.base64, byteSize: image.byteSize, width: image.width, height: image.height })));
    }
    await tx.update(socialPosts).set({ projectId: parsed.data.projectId || null, body: `${parsed.data.title} - ${parsed.data.tagline}`.slice(0, 800) }).where(eq(socialPosts.launchId, entryId));
  });
  const slug = own[0].slug || entryId;
  await revalidateLaunch(slug, user.id);
  return { success: true, slug } as const;
}

export async function deleteLaunch(entryId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to delete this project." : "Zaloguj się, aby usunąć projekt." };
  if (!isUuid(entryId)) return { error: en ? "Invalid project." : "Nieprawidłowy projekt." };
  const own = await db.select({ creatorId: showcaseEntries.creatorId, slug: showcaseEntries.slug }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  if (!own[0] || own[0].creatorId !== user.id) return { error: en ? "You cannot delete this launch." : "Nie możesz usunąć tej premiery." };
  await db.transaction(async (tx) => {
    await tx.delete(socialPosts).where(eq(socialPosts.launchId, entryId));
    await tx.delete(showcaseEntries).where(eq(showcaseEntries.id, entryId));
  });
  await revalidateLaunch(own[0].slug || entryId, user.id);
  return { success: true } as const;
}

export async function toggleLaunchVote(entryId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to vote." : "Zaloguj się, aby zagłosować." };
  if (!isUuid(entryId)) return { error: en ? "Invalid project." : "Nieprawidłowy projekt." };
  const rateError = await enforceUserRateLimit("action:launch:vote", user.id, 100, 60 * 60);
  if (rateError) return { error: rateError };
  const entry = await db.select({ creatorId: showcaseEntries.creatorId, title: showcaseEntries.title, slug: showcaseEntries.slug }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  if (!entry[0]) return { error: en ? "Project not found." : "Nie znaleziono projektu." };
  const existing = await db.select({ entryId: showcaseReactions.entryId }).from(showcaseReactions)
    .where(and(eq(showcaseReactions.entryId, entryId), eq(showcaseReactions.userId, user.id), eq(showcaseReactions.reaction, "APPLAUSE"))).limit(1);
  if (existing[0]) {
    await db.delete(showcaseReactions).where(and(eq(showcaseReactions.entryId, entryId), eq(showcaseReactions.userId, user.id), eq(showcaseReactions.reaction, "APPLAUSE")));
    await revalidateLaunch(entry[0].slug || entryId);
    return { success: true, voted: false } as const;
  }
  await db.insert(showcaseReactions).values({ entryId, userId: user.id, reaction: "APPLAUSE" }).onConflictDoNothing();
  if (entry[0].creatorId !== user.id) {
    const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await createNotification(entry[0].creatorId, "SHOWCASE_REACTION", `${actor[0]?.username ?? "Ktoś"} zagłosował na ${entry[0].title}`, undefined, `/launches/${entry[0].slug || entryId}`, { actorId: user.id, entityType: "showcase", entityId: entryId, titleEn: `${actor[0]?.username ?? "Someone"} voted for ${entry[0].title}` });
  }
  await revalidateLaunch(entry[0].slug || entryId);
  return { success: true, voted: true } as const;
}

export async function addLaunchComment(entryId: string, input: { body: string; parentId?: string }) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to comment." : "Zaloguj się, aby dodać komentarz." };
  if (!isUuid(entryId)) return { error: en ? "Invalid project." : "Nieprawidłowy projekt." };
  const parsed = launchCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? (en ? "Check the comment." : "Sprawdź komentarz.") };
  const rateError = await enforceUserRateLimit("action:launch:comment", user.id, 30, 60 * 60);
  if (rateError) return { error: rateError };
  const entry = await db.select({ creatorId: showcaseEntries.creatorId, title: showcaseEntries.title, slug: showcaseEntries.slug }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  if (!entry[0]) return { error: en ? "Project not found." : "Nie znaleziono projektu." };

  let parentAuthorId: string | null = null;
  let parentId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await db.select({ id: showcaseComments.id, authorId: showcaseComments.authorId, parentId: showcaseComments.parentId }).from(showcaseComments)
      .where(and(eq(showcaseComments.id, parsed.data.parentId), eq(showcaseComments.entryId, entryId))).limit(1);
    if (!parent[0]) return { error: en ? "The comment you are replying to no longer exists." : "Komentarz, na który odpowiadasz, już nie istnieje." };
    if (parent[0].parentId) return { error: en ? "Replies can only be one level deep." : "Odpowiedzi mogą mieć tylko jeden poziom." };
    parentId = parent[0].id;
    parentAuthorId = parent[0].authorId;
  }

  await db.insert(showcaseComments).values({ entryId, authorId: user.id, parentId, body: parsed.data.body });
  const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const notifyUserId = parentAuthorId && parentAuthorId !== user.id ? parentAuthorId : entry[0].creatorId !== user.id ? entry[0].creatorId : null;
  if (notifyUserId) {
    await createNotification(notifyUserId, "SHOWCASE_FEEDBACK", `${actor[0]?.username ?? "Ktoś"} dodał komentarz do ${entry[0].title}`, parsed.data.body.slice(0, 180), `/launches/${entry[0].slug || entryId}`, { actorId: user.id, entityType: "showcase", entityId: entryId, emailPreference: "emailShowcaseFeedback", titleEn: `${actor[0]?.username ?? "Someone"} commented on ${entry[0].title}`, bodyEn: parsed.data.body.slice(0, 180) });
  }
  await revalidateLaunch(entry[0].slug || entryId);
  return { success: true } as const;
}

export async function deleteLaunchComment(commentId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to delete the comment." : "Zaloguj się, aby usunąć komentarz." };
  if (!isUuid(commentId)) return { error: en ? "Invalid comment." : "Nieprawidłowy komentarz." };
  const rows = await db.select({ entryId: showcaseComments.entryId, authorId: showcaseComments.authorId, slug: showcaseEntries.slug })
    .from(showcaseComments).innerJoin(showcaseEntries, eq(showcaseEntries.id, showcaseComments.entryId)).where(eq(showcaseComments.id, commentId)).limit(1);
  if (!rows[0] || rows[0].authorId !== user.id) return { error: en ? "You cannot delete this comment." : "Nie możesz usunąć tego komentarza." };
  await db.delete(showcaseComments).where(eq(showcaseComments.id, commentId));
  await db.update(showcaseComments).set({ parentId: null }).where(eq(showcaseComments.parentId, commentId));
  await revalidateLaunch(rows[0].slug || rows[0].entryId);
  return { success: true } as const;
}
