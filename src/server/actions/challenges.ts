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
  if (!admin) return { error: "Brak uprawnień." };
  const parsed = challengeCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź formularz." };
  const [challenge] = await db.insert(buildChallenges).values({
    ...parsed.data,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    createdBy: admin.id,
    status: "OPEN",
  }).returning({ id: buildChallenges.id });
  revalidatePath("/showcase/challenges");
  revalidatePath("/admin/challenges");
  return { success: true, id: challenge.id };
}

export async function setChallengeStatus(challengeId: string, status: "OPEN" | "BUILDING" | "VOTING" | "CLOSED") {
  const admin = await requireAdmin();
  if (!admin || !uuidSchema.safeParse(challengeId).success) return { error: "Brak uprawnień lub błędne dane." };
  const rows = await db.update(buildChallenges).set({ status }).where(eq(buildChallenges.id, challengeId)).returning({ title: buildChallenges.title });
  if (!rows[0]) return { error: "Challenge nie istnieje." };

  const participants = await db.select({ userId: challengeParticipants.userId }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId));
  await Promise.all(participants.map((participant) => createNotification(participant.userId, "CHALLENGE_UPDATE", `${rows[0].title}: status został zmieniony`, status === "BUILDING" ? "Czas budować. Powodzenia!" : status === "VOTING" ? "Możecie publikować projekty i głosować." : status === "CLOSED" ? "Challenge zakończony — zobacz wyniki." : "Zapisy są otwarte.", `/showcase/challenges/${challengeId}`, { entityType: "challenge", entityId: challengeId, emailPreference: "emailChallenge" })));
  revalidatePath(`/showcase/challenges/${challengeId}`);
  revalidatePath("/showcase/challenges");
  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function joinChallenge(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const parsed = challengeJoinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane." };
  const challengeRows = await db.select().from(buildChallenges).where(eq(buildChallenges.id, parsed.data.challengeId)).limit(1);
  const challenge = challengeRows[0];
  if (!challenge || !["OPEN", "BUILDING"].includes(challenge.status)) return { error: "Zapisy do tego challenge są zamknięte." };

  const profileRows = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (!profileRows[0]) return { error: "Najpierw uzupełnij profil." };

  let crewId: string | null = null;
  if (parsed.data.mode === "HAS_CREW") {
    const candidateCrewId = parsed.data.crewId || null;
    if (!candidateCrewId) return { error: "Wybierz swoją ekipę." };
    const membership = await db.select({ crewId: crewMembers.crewId }).from(crewMembers).where(and(eq(crewMembers.crewId, candidateCrewId), eq(crewMembers.userId, user.id))).limit(1);
    if (!membership[0]) return { error: "Nie należysz do tej ekipy." };
    crewId = candidateCrewId;
  }

  await db.insert(challengeParticipants).values({ challengeId: parsed.data.challengeId, userId: user.id, mode: parsed.data.mode, crewId, role: profileRows[0].role })
    .onConflictDoUpdate({ target: [challengeParticipants.challengeId, challengeParticipants.userId], set: { mode: parsed.data.mode, crewId, role: profileRows[0].role } });
  revalidatePath(`/showcase/challenges/${parsed.data.challengeId}`);
  revalidatePath("/showcase/challenges");
  return { success: true };
}

export async function leaveChallenge(challengeId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(challengeId).success) return { error: "Nieprawidłowe dane." };
  await db.delete(challengeParticipants).where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, user.id)));
  revalidatePath(`/showcase/challenges/${challengeId}`);
  return { success: true };
}
