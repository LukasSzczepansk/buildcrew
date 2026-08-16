"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  crewMembers,
  projectMembers,
  projects,
  showcaseEntries,
  showcaseFeedback,
  showcaseReactions,
  profiles,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { showcaseCreateSchema, showcaseFeedbackSchema, showcaseReactionSchema, uuidSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notifications";
import { getChallengeParticipation } from "@/server/data/showcase";

async function isEntryContributor(entry: { creatorId: string; projectId: string | null; crewId: string | null }, userId: string) {
  if (entry.creatorId === userId) return true;
  if (entry.projectId) {
    const member = await db.select({ userId: projectMembers.userId }).from(projectMembers).where(and(eq(projectMembers.projectId, entry.projectId), eq(projectMembers.userId, userId))).limit(1);
    if (member[0]) return true;
  }
  if (entry.crewId) {
    const member = await db.select({ userId: crewMembers.userId }).from(crewMembers).where(and(eq(crewMembers.crewId, entry.crewId), eq(crewMembers.userId, userId))).limit(1);
    if (member[0]) return true;
  }
  return false;
}

export async function createShowcaseEntry(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:showcase:create", user.id, 8, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = showcaseCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;

  let crewId: string | null = null;
  if (data.projectId) {
    const membership = await db.select({ projectId: projectMembers.projectId }).from(projectMembers)
      .where(and(eq(projectMembers.projectId, data.projectId), eq(projectMembers.userId, user.id))).limit(1);
    if (!membership[0]) return { error: "You can publish only a project you contributed to." };
    const projectRows = await db.select({ crewId: projects.crewId }).from(projects).where(eq(projects.id, data.projectId)).limit(1);
    crewId = projectRows[0]?.crewId ?? null;
  }

  if (data.challengeId) {
    const participation = await getChallengeParticipation(data.challengeId, user.id);
    if (!participation) return { error: "Join this Build Challenge first." };
    if (!crewId && participation.crewId) crewId = participation.crewId;
  }

  const [entry] = await db.insert(showcaseEntries).values({
    creatorId: user.id,
    projectId: data.projectId || null,
    crewId,
    challengeId: data.challengeId || null,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    screenshotUrl: data.screenshotUrl || null,
    liveUrl: data.liveUrl || null,
    githubUrl: data.githubUrl || null,
    category: data.category,
    status: data.status,
    lookingForCollaborators: data.lookingForCollaborators,
    lookingForText: data.lookingForText || null,
  }).returning({ id: showcaseEntries.id });

  revalidatePath("/showcase");
  revalidatePath("/profile");
  redirect(`/showcase/${entry.id}`);
}

export async function toggleShowcaseReaction(entryId: string, reaction: string) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (!uuidSchema.safeParse(entryId).success) return { error: "Invalid project." };
  const parsedReaction = showcaseReactionSchema.safeParse(reaction);
  if (!parsedReaction.success) return { error: "Invalid reaction." };
  const rateError = await enforceUserRateLimit("action:showcase:reaction", user.id, 80, 60 * 60);
  if (rateError) return { error: rateError };

  const entries = await db.select({ id: showcaseEntries.id, creatorId: showcaseEntries.creatorId, projectId: showcaseEntries.projectId, crewId: showcaseEntries.crewId, title: showcaseEntries.title }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  const entry = entries[0];
  if (!entry) return { error: "Project not found." };
  if (await isEntryContributor(entry, user.id)) return { error: "You cannot react to your own team's project." };

  const existing = await db.select().from(showcaseReactions).where(and(eq(showcaseReactions.entryId, entryId), eq(showcaseReactions.userId, user.id), eq(showcaseReactions.reaction, parsedReaction.data))).limit(1);
  if (existing[0]) {
    await db.delete(showcaseReactions).where(and(eq(showcaseReactions.entryId, entryId), eq(showcaseReactions.userId, user.id), eq(showcaseReactions.reaction, parsedReaction.data)));
  } else {
    await db.insert(showcaseReactions).values({ entryId, userId: user.id, reaction: parsedReaction.data });
    const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await createNotification(entry.creatorId, "SHOWCASE_REACTION", `${profileRows[0]?.username ?? "Someone"} reacted to ${entry.title}`, undefined, `/showcase/${entryId}`, { actorId: user.id, entityType: "showcase", entityId: entryId, titleEn: `${profileRows[0]?.username ?? "Someone"} reacted to ${entry.title}` });
  }
  revalidatePath(`/showcase/${entryId}`);
  revalidatePath("/showcase");
  return { success: true, active: !existing[0] };
}

export async function submitShowcaseFeedback(entryId: string, input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (!uuidSchema.safeParse(entryId).success) return { error: "Invalid project." };
  const parsed = showcaseFeedbackSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the feedback." };
  const rateError = await enforceUserRateLimit("action:showcase:feedback", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const entries = await db.select({ creatorId: showcaseEntries.creatorId, projectId: showcaseEntries.projectId, crewId: showcaseEntries.crewId, title: showcaseEntries.title }).from(showcaseEntries).where(eq(showcaseEntries.id, entryId)).limit(1);
  const entry = entries[0];
  if (!entry) return { error: "Project not found." };
  if (await isEntryContributor(entry, user.id)) return { error: "You cannot leave feedback on your own team's project." };

  await db.insert(showcaseFeedback).values({ entryId, userId: user.id, ...parsed.data, liked: parsed.data.liked || null, improve: parsed.data.improve || null })
    .onConflictDoUpdate({ target: [showcaseFeedback.entryId, showcaseFeedback.userId], set: { ...parsed.data, liked: parsed.data.liked || null, improve: parsed.data.improve || null, updatedAt: new Date() } });

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(entry.creatorId, "SHOWCASE_FEEDBACK", `${profileRows[0]?.username ?? "Someone"} left feedback on ${entry.title}`, "See what worked well and what could be improved.", `/showcase/${entryId}`, { actorId: user.id, entityType: "showcase", entityId: entryId, emailPreference: "emailShowcaseFeedback", titleEn: `${profileRows[0]?.username ?? "Someone"} left feedback on ${entry.title}`, bodyEn: "See what is worth keeping and what could be improved." });
  revalidatePath(`/showcase/${entryId}`);
  return { success: true };
}
