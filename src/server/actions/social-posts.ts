"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  projectMembers,
  projectRoles,
  projects,
  socialPostComments,
  socialPostLikes,
  socialPostSaves,
  socialPosts,
  type SocialPostKind,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit, isUuid } from "@/lib/security";
import { getRequestLocale } from "@/lib/site-server";

const kindSchema = z.enum(["UPDATE", "QUESTION", "KNOWLEDGE", "IDEA", "LOOKING_FOR_PEOPLE", "LOOKING_FOR_PROJECT", "MILESTONE", "LAUNCH", "OPEN_TO_BUILDING"]);
const schema = z.object({
  kind: kindSchema,
  body: z.string().trim().min(20).max(800),
  projectId: z.string().uuid().optional().or(z.literal("")),
});

const projectKinds = new Set<SocialPostKind>(["UPDATE", "LOOKING_FOR_PEOPLE", "MILESTONE", "LAUNCH"]);

export async function createSocialPost(input: { kind: SocialPostKind; body: string; projectId?: string }) {
  const parsed = schema.safeParse(input);
  const locale = await getRequestLocale();
  const en = locale === "en";
  if (!parsed.success) return { error: en ? "Write at least 20 characters." : "Napisz co najmniej 20 znaków." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "You must be logged in." : "Musisz być zalogowany." };
  const rate = await enforceUserRateLimit("action:social-post:create", user.id, 8, 24 * 60 * 60);
  if (rate) return { error: rate };

  let projectId: string | null = null;
  if (projectKinds.has(parsed.data.kind)) {
    if (!parsed.data.projectId) return { error: en ? "Choose a project." : "Wybierz projekt." };
    const projectRows = await db.select({ id: projects.id, ownerId: projects.ownerId }).from(projects)
      .where(and(eq(projects.id, parsed.data.projectId), eq(projects.lifecycleStatus, "ACTIVE")))
      .limit(1);
    const project = projectRows[0];
    if (!project) return { error: en ? "This project is not active." : "Ten projekt nie jest aktywny." };

    if (parsed.data.kind === "LOOKING_FOR_PEOPLE") {
      if (project.ownerId !== user.id) return { error: en ? "Only the project owner can publish a teammate search." : "Tylko właściciel projektu może opublikować post o szukaniu ludzi." };
      const openRoles = await db.select({ id: projectRoles.id }).from(projectRoles).where(eq(projectRoles.projectId, project.id));
      if (!openRoles.length) return { error: en ? "Add an open role to the project first." : "Najpierw dodaj otwartą rolę do projektu." };
    } else if (project.ownerId !== user.id) {
      const membership = await db.select({ userId: projectMembers.userId }).from(projectMembers)
        .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, user.id)))
        .limit(1);
      if (!membership[0]) return { error: en ? "Only project members can publish this update." : "Tylko członkowie projektu mogą opublikować tę aktualizację." };
    }
    projectId = project.id;
  }

  const expiring = parsed.data.kind === "LOOKING_FOR_PEOPLE" || parsed.data.kind === "LOOKING_FOR_PROJECT" || parsed.data.kind === "OPEN_TO_BUILDING";
  const [created] = await db.insert(socialPosts).values({
    authorId: user.id,
    kind: parsed.data.kind,
    projectId,
    body: parsed.data.body,
    expiresAt: expiring ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
  }).returning({ id: socialPosts.id });

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/network");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { success: true, id: created?.id } as const;
}

export async function toggleSocialPostLike(postId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to like posts." : "Zaloguj się, aby polubić post." };
  if (!isUuid(postId)) return { error: en ? "Invalid post." : "Nieprawidłowy post." };
  const rate = await enforceUserRateLimit("action:social-post:like", user.id, 120, 60 * 60);
  if (rate) return { error: rate };

  const existing = await db.select({ postId: socialPostLikes.postId }).from(socialPostLikes)
    .where(and(eq(socialPostLikes.postId, postId), eq(socialPostLikes.userId, user.id))).limit(1);
  if (existing[0]) {
    await db.delete(socialPostLikes).where(and(eq(socialPostLikes.postId, postId), eq(socialPostLikes.userId, user.id)));
    revalidatePost(postId);
    return { success: true, liked: false } as const;
  }
  await db.insert(socialPostLikes).values({ postId, userId: user.id }).onConflictDoNothing();
  revalidatePost(postId);
  return { success: true, liked: true } as const;
}

export async function toggleSocialPostSave(postId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to save posts." : "Zaloguj się, aby zapisywać posty." };
  if (!isUuid(postId)) return { error: en ? "Invalid post." : "Nieprawidłowy post." };

  const existing = await db.select({ postId: socialPostSaves.postId }).from(socialPostSaves)
    .where(and(eq(socialPostSaves.postId, postId), eq(socialPostSaves.userId, user.id))).limit(1);
  if (existing[0]) {
    await db.delete(socialPostSaves).where(and(eq(socialPostSaves.postId, postId), eq(socialPostSaves.userId, user.id)));
    revalidatePost(postId);
    return { success: true, saved: false } as const;
  }
  await db.insert(socialPostSaves).values({ postId, userId: user.id }).onConflictDoNothing();
  revalidatePost(postId);
  return { success: true, saved: true } as const;
}

export async function addSocialPostComment(postId: string, body: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "Sign in to comment." : "Zaloguj się, aby komentować." };
  if (!isUuid(postId)) return { error: en ? "Invalid post." : "Nieprawidłowy post." };
  const parsed = z.string().trim().min(2).max(500).safeParse(body);
  if (!parsed.success) return { error: en ? "Comment must be between 2 and 500 characters." : "Komentarz musi mieć od 2 do 500 znaków." };
  const rate = await enforceUserRateLimit("action:social-post:comment", user.id, 30, 60 * 60);
  if (rate) return { error: rate };

  const active = await db.select({ id: socialPosts.id }).from(socialPosts).where(and(eq(socialPosts.id, postId), eq(socialPosts.isActive, true))).limit(1);
  if (!active[0]) return { error: en ? "This post is no longer available." : "Ten post nie jest już dostępny." };
  await db.insert(socialPostComments).values({ postId, authorId: user.id, body: parsed.data });
  revalidatePost(postId);
  return { success: true } as const;
}

export async function deleteSocialPost(postId: string) {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: en ? "You must be logged in." : "Musisz być zalogowany." };
  if (!isUuid(postId)) return { error: en ? "Invalid post." : "Nieprawidłowy post." };
  const own = await db.select({ authorId: socialPosts.authorId }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!own[0] || own[0].authorId !== user.id) return { error: en ? "You cannot delete this post." : "Nie możesz usunąć tego posta." };
  await db.update(socialPosts).set({ isActive: false }).where(eq(socialPosts.id, postId));
  revalidatePost(postId);
  return { success: true } as const;
}

function revalidatePost(postId: string) {
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath(`/s/${postId}`);
}
