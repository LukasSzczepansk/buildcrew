"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborationEndorsements, follows, profiles, projectMembers, projects, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit, isNewAccount } from "@/lib/security";
import { collaborationEndorsementSchema, uuidSchema } from "@/lib/validations";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";

export async function followUser(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.id === targetUserId) return { error: "You cannot follow yourself." };
  const rateError = await enforceUserRateLimit("action:network:follow", user.id, (await isNewAccount(user.id)) ? 25 : 60, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (await isBlockedEitherWay(user.id, targetUserId)) return { error: "This person is not available." };

  const target = await db.select({ id: users.id, suspended: users.isSuspended, onboarding: profiles.onboardingCompleted })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, targetUserId)).limit(1);
  if (!target[0] || target[0].suspended || !target[0].onboarding) return { error: "This person is not available." };

  await db.insert(follows).values({ followerId: user.id, followingId: targetUserId }).onConflictDoNothing();
  const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(targetUserId, "FOLLOW_STARTED", `${actor[0]?.username ?? "Ktoś"} obserwuje Twój profil`, "Ta osoba zobaczy informacje o nowych projektach, które opublikujesz.", `/builders/${user.id}`, { actorId: user.id, entityType: "profile", entityId: user.id, titleEn: `${actor[0]?.username ?? "Someone"} is following your profile`, bodyEn: "They will be notified when you publish a new project." });
  await logEvent("network_follow", user.id, { targetUserId });
  revalidatePath("/network");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}

export async function unfollowUser(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  await db.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)));
  await logEvent("network_unfollow", user.id, { targetUserId });
  revalidatePath("/network");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}

export async function endorseCollaborator(input: unknown) {
  const parsed = collaborationEndorsementSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the provided data." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.id === parsed.data.targetUserId) return { error: "You cannot endorse yourself." };
  const rateError = await enforceUserRateLimit("action:network:endorse", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const [membershipRows, targetRows, project, targetProfile] = await Promise.all([
    db.select({ isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus }).from(projectMembers)
      .where(and(eq(projectMembers.projectId, parsed.data.projectId), eq(projectMembers.userId, user.id))).limit(1),
    db.select({ isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus }).from(projectMembers)
      .where(and(eq(projectMembers.projectId, parsed.data.projectId), eq(projectMembers.userId, parsed.data.targetUserId))).limit(1),
    db.select({ name: projects.name, ownerId: projects.ownerId }).from(projects).where(eq(projects.id, parsed.data.projectId)).limit(1),
    db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, parsed.data.targetUserId)).limit(1),
  ]);
  if (!membershipRows[0] || !targetRows[0] || !project[0] || !targetProfile[0]) return { error: "Project or user not found." };
  const verifiedPair = project[0].ownerId === user.id
    ? targetRows[0].collaborationStatus === "CONFIRMED"
    : project[0].ownerId === parsed.data.targetUserId && membershipRows[0].collaborationStatus === "CONFIRMED";
  if (!verifiedPair) return { error: "Endorsements unlock only after both sides confirm that the collaboration actually started." };

  await db.insert(collaborationEndorsements).values({
    projectId: parsed.data.projectId,
    reviewerId: user.id,
    revieweeId: parsed.data.targetUserId,
    strengths: parsed.data.strengths,
    wouldCollaborateAgain: parsed.data.wouldCollaborateAgain,
    note: parsed.data.note || null,
  }).onConflictDoUpdate({
    target: [collaborationEndorsements.projectId, collaborationEndorsements.reviewerId, collaborationEndorsements.revieweeId],
    set: {
      strengths: parsed.data.strengths,
      wouldCollaborateAgain: parsed.data.wouldCollaborateAgain,
      note: parsed.data.note || null,
      updatedAt: new Date(),
    },
  });

  const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(parsed.data.targetUserId, "COLLABORATION_ENDORSEMENT", `${actor[0]?.username ?? "Współpracownik"} poleca współpracę z Tobą`, `Na podstawie projektu ${project[0].name}.`, `/builders/${parsed.data.targetUserId}`, { actorId: user.id, entityType: "project", entityId: parsed.data.projectId, titleEn: `${actor[0]?.username ?? "A collaborator"} endorsed working with you`, bodyEn: `Based on ${project[0].name}.` });
  await logEvent("collaboration_endorsed", user.id, { projectId: parsed.data.projectId, targetUserId: parsed.data.targetUserId, strengths: parsed.data.strengths });
  revalidatePath("/network");
  revalidatePath(`/builders/${parsed.data.targetUserId}`);
  return { success: true };
}
