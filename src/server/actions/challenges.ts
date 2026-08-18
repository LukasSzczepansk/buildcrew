"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { buildChallenges, challengeParticipants, crewMembers, profiles } from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { challengeCreateSchema, challengeJoinSchema, uuidSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notifications";

async function requireAdmin() {
  const user = await getVerifiedCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) return null;
  return user;
}

export async function createChallenge(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = challengeCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const [challenge] = await db.insert(buildChallenges).values({
    ...parsed.data,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    createdBy: admin.id,
    status: "OPEN",
  }).returning({ id: buildChallenges.id });
  revalidatePath("/sprint");
  revalidatePath("/admin/challenges");
  return { success: true, id: challenge.id };
}

export async function setChallengeStatus(challengeId: string, status: "OPEN" | "BUILDING" | "VOTING" | "CLOSED") {
  const admin = await requireAdmin();
  if (!admin || !uuidSchema.safeParse(challengeId).success) return { error: "You do not have permission or the data is invalid." };
  const rows = await db.update(buildChallenges).set({ status }).where(eq(buildChallenges.id, challengeId)).returning({ title: buildChallenges.title });
  if (!rows[0]) return { error: "Challenge not found." };

  const participants = await db.select({ userId: challengeParticipants.userId }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId));
  await Promise.all(participants.map((participant) => createNotification(participant.userId, "CHALLENGE_UPDATE", `${rows[0].title}: status changed`, status === "BUILDING" ? "Time to build. Good luck!" : status === "VOTING" ? "You can now publish projects and vote." : status === "CLOSED" ? "The challenge is over - see the results." : "Registration is open.", "/sprint", { entityType: "challenge", entityId: challengeId, emailPreference: "emailChallenge", titleEn: `${rows[0].title}: status changed`, bodyEn: status === "BUILDING" ? "Time to build. Good luck!" : status === "VOTING" ? "You can now publish projects and vote." : status === "CLOSED" ? "The challenge is over - see the results." : "Registration is open." })));
  revalidatePath("/sprint");
  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function joinChallenge(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = challengeJoinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the provided data." };
  const challengeRows = await db.select().from(buildChallenges).where(eq(buildChallenges.id, parsed.data.challengeId)).limit(1);
  const challenge = challengeRows[0];
  if (!challenge || !["OPEN", "BUILDING"].includes(challenge.status)) return { error: "Registration for this challenge is closed." };

  const profileRows = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (!profileRows[0]) return { error: "Complete your profile first." };

  let crewId: string | null = null;
  if (parsed.data.mode === "HAS_CREW") {
    const candidateCrewId = parsed.data.crewId || null;
    if (!candidateCrewId) return { error: "Choose your crew." };
    const membership = await db.select({ crewId: crewMembers.crewId }).from(crewMembers).where(and(eq(crewMembers.crewId, candidateCrewId), eq(crewMembers.userId, user.id))).limit(1);
    if (!membership[0]) return { error: "You are not a member of this crew." };
    crewId = candidateCrewId;
  }

  const applicationData = {
    version: 1 as const,
    ...parsed.data.application,
    ideaDescription: parsed.data.application.ideaDescription?.trim() || undefined,
    submittedAt: new Date().toISOString(),
  };

  await db.insert(challengeParticipants).values({
    challengeId: parsed.data.challengeId,
    userId: user.id,
    mode: parsed.data.mode,
    crewId,
    role: parsed.data.application.role,
    applicationData,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [challengeParticipants.challengeId, challengeParticipants.userId],
    set: {
      mode: parsed.data.mode,
      crewId,
      role: parsed.data.application.role,
      applicationData,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/sprint");
  return { success: true };
}

export async function leaveChallenge(challengeId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(challengeId).success) return { error: "Invalid data." };
  await db.delete(challengeParticipants).where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, user.id)));
  revalidatePath("/sprint");
  return { success: true };
}
