"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { buildChallenges, challengeParticipants, crewMembers, crews, profiles, sprintAnnouncements, sprintCheckIns } from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { challengeCreateSchema, challengeJoinSchema, sprintAnnouncementCreateSchema, sprintCheckInSchema, sprintCrewCreateSchema, sprintParticipantAdminStatusSchema, sprintSettingsUpdateSchema, uuidSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notifications";
import { listChallengeMatches } from "@/server/data/showcase";
import { SPRINT_TERMS_VERSION } from "@/lib/sprint-terms";

async function requireAdmin() {
  const user = await getVerifiedCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) return null;
  return user;
}


export async function launchDefaultSprintFromForm(_formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/sprint/apply");

  const existing = await db.select({ id: buildChallenges.id })
    .from(buildChallenges)
    .where(inArray(buildChallenges.status, ["OPEN", "BUILDING"]))
    .limit(1);

  if (!existing[0]) {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 7);
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + 30);

    await db.insert(buildChallenges).values({
      title: "BuildCrew Sprint #1",
      prompt: "W 30 dni zbudujcie i wypuśćcie działający produkt",
      description: "30 dni. Jedna ekipa. Jeden działający projekt. BuildCrew dobiera ludzi według roli, stacku, dostępności i celu.",
      category: "BuildCrew Sprint",
      status: "OPEN",
      startsAt,
      endsAt,
      settings: {
        capacity: 40,
        applicationsCloseAt: startsAt.toISOString(),
        teamRevealAt: startsAt.toISOString(),
        demoDayAt: endsAt.toISOString(),
        maxCrewSize: 4,
      },
      createdBy: admin.id,
    });
  }

  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  redirect("/sprint/apply");
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
    settings: parsed.data.settings ?? {},
    createdBy: admin.id,
    status: "OPEN",
  }).returning({ id: buildChallenges.id });
  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
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
  revalidatePath("/sprint/apply");
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

  const existingParticipation = await db.select({ userId: challengeParticipants.userId })
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, parsed.data.challengeId), eq(challengeParticipants.userId, user.id)))
    .limit(1);
  if (!existingParticipation[0]) {
    if (challenge.settings?.applicationsCloseAt && Date.now() > new Date(challenge.settings.applicationsCloseAt).getTime()) return { error: "The application deadline has passed." };
    const capacity = challenge.settings?.capacity;
    if (capacity) {
      const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, parsed.data.challengeId));
      if ((countRows[0]?.count ?? 0) >= capacity) return { error: "This Sprint is already full." };
    }
  }
  if (challenge.settings?.allowedRoles?.length && !challenge.settings.allowedRoles.includes(parsed.data.application.role)) return { error: "This role is not open in the current Sprint." };
  if (challenge.settings?.minWeeklyHours) {
    const commitmentOrder = ["1-2", "3-5", "5-10", "10+"] as const;
    if (commitmentOrder.indexOf(parsed.data.application.weeklyHours) < commitmentOrder.indexOf(challenge.settings.minWeeklyHours)) return { error: `This Sprint requires at least ${challenge.settings.minWeeklyHours} hours of weekly availability.` };
  }

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

  const { sprintTermsAccepted: _sprintTermsAccepted, ...application } = parsed.data.application;
  const acceptedAt = new Date().toISOString();
  const applicationData = {
    version: 1 as const,
    ...application,
    ideaDescription: application.ideaDescription?.trim() || undefined,
    sprintTermsVersion: SPRINT_TERMS_VERSION,
    sprintTermsAcceptedAt: acceptedAt,
    submittedAt: acceptedAt,
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
  revalidatePath("/sprint/apply");
  return { success: true };
}

export async function leaveChallenge(challengeId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(challengeId).success) return { error: "Invalid data." };
  await db.delete(challengeParticipants).where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, user.id)));
  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
  return { success: true };
}


export async function updateSprintSettings(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = sprintSettingsUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the Sprint settings." };
  const [row] = await db.update(buildChallenges).set({
    settings: {
      capacity: parsed.data.capacity,
      applicationsCloseAt: parsed.data.applicationsCloseAt || undefined,
      teamRevealAt: parsed.data.teamRevealAt || undefined,
      demoDayAt: parsed.data.demoDayAt || undefined,
      minWeeklyHours: parsed.data.minWeeklyHours,
      allowedRoles: parsed.data.allowedRoles,
      maxCrewSize: parsed.data.maxCrewSize,
    },
  }).where(eq(buildChallenges.id, parsed.data.challengeId)).returning({ id: buildChallenges.id });
  if (!row) return { error: "Sprint not found." };
  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function setSprintParticipantStatus(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = sprintParticipantAdminStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the data." };

  const [participant] = await db.update(challengeParticipants).set({
    participantStatus: parsed.data.status,
    adminNote: parsed.data.adminNote?.trim() || null,
    decisionAt: new Date(),
    updatedAt: new Date(),
  }).where(and(
    eq(challengeParticipants.challengeId, parsed.data.challengeId),
    eq(challengeParticipants.userId, parsed.data.userId),
  )).returning({ userId: challengeParticipants.userId });

  if (!participant) return { error: "Application not found." };

  const title = parsed.data.status === "ACCEPTED"
    ? "Your BuildCrew Sprint application was accepted"
    : parsed.data.status === "WAITLIST"
      ? "Your BuildCrew Sprint application is on the waitlist"
      : parsed.data.status === "REJECTED"
        ? "BuildCrew Sprint application update"
        : `BuildCrew Sprint status: ${parsed.data.status}`;

  await createNotification(parsed.data.userId, "CHALLENGE_UPDATE", title, parsed.data.adminNote?.trim() || undefined, "/sprint/apply", {
    entityType: "challenge",
    entityId: parsed.data.challengeId,
    emailPreference: "emailChallenge",
    titleEn: title,
    bodyEn: parsed.data.adminNote?.trim() || null,
  });

  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function getSprintAdminMatches(challengeId: string, userId: string) {
  const admin = await requireAdmin();
  if (!admin || !uuidSchema.safeParse(challengeId).success || !uuidSchema.safeParse(userId).success) {
    return { error: "Invalid request.", matches: [] };
  }
  const matches = await listChallengeMatches(challengeId, userId, "pl");
  return {
    matches: matches.slice(0, 6).map((item) => ({
      userId: item.profile.userId,
      username: item.profile.username,
      avatarEmoji: item.profile.avatarEmoji,
      role: item.profile.role,
      score: item.score,
      reasons: item.reasons,
    })),
  };
}

export async function createSprintCrew(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = sprintCrewCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose at least two people." };

  const challengeRows = await db.select({
    id: buildChallenges.id,
    title: buildChallenges.title,
    status: buildChallenges.status,
    settings: buildChallenges.settings,
  }).from(buildChallenges).where(eq(buildChallenges.id, parsed.data.challengeId)).limit(1);
  const challenge = challengeRows[0];
  if (!challenge) return { error: "Sprint not found." };

  const maxCrewSize = challenge.settings?.maxCrewSize ?? 4;
  if (parsed.data.userIds.length > maxCrewSize) return { error: `This Sprint allows up to ${maxCrewSize} people per Crew.` };

  const outcome = await db.transaction(async (tx) => {
    const participantRows = await tx.select({
      userId: challengeParticipants.userId,
      crewId: challengeParticipants.crewId,
      status: challengeParticipants.participantStatus,
    }).from(challengeParticipants).where(and(
      eq(challengeParticipants.challengeId, parsed.data.challengeId),
      inArray(challengeParticipants.userId, parsed.data.userIds),
    ));

    if (participantRows.length !== parsed.data.userIds.length) return { error: "One of the selected people is not registered for this Sprint." } as const;
    if (participantRows.some((item) => item.crewId)) return { error: "One of the selected people is already assigned to a Sprint Crew." } as const;
    if (participantRows.some((item) => ["REJECTED", "DROPPED"].includes(item.status))) return { error: "Rejected or dropped participants cannot be assigned to a Crew." } as const;

    const activeMemberships = await tx.select({ userId: crewMembers.userId })
      .from(crewMembers)
      .innerJoin(crews, eq(crews.id, crewMembers.crewId))
      .where(and(inArray(crewMembers.userId, parsed.data.userIds), eq(crews.status, "FORMING")));
    if (activeMemberships.length) return { error: "One of the selected people already belongs to an active Crew." } as const;

    const [crew] = await tx.insert(crews).values({
      createdBy: parsed.data.userIds[0],
      status: "FORMING",
    }).returning({ id: crews.id });

    await tx.insert(crewMembers).values(parsed.data.userIds.map((userId) => ({ crewId: crew.id, userId })));
    await tx.update(challengeParticipants).set({
      crewId: crew.id,
      mode: "HAS_CREW",
      participantStatus: "MATCHED",
      decisionAt: new Date(),
      updatedAt: new Date(),
    }).where(and(
      eq(challengeParticipants.challengeId, parsed.data.challengeId),
      inArray(challengeParticipants.userId, parsed.data.userIds),
    ));

    return { crewId: crew.id } as const;
  });

  if ("error" in outcome) return outcome;

  await Promise.all(parsed.data.userIds.map((userId) => createNotification(
    userId,
    "CHALLENGE_UPDATE",
    `Your Crew for ${challenge.title} is ready`,
    "Open BuildCrew Sprint to see your team and start building.",
    "/sprint/apply",
    {
      entityType: "challenge",
      entityId: parsed.data.challengeId,
      emailPreference: "emailChallenge",
      titleEn: `Your Crew for ${challenge.title} is ready`,
      bodyEn: "Open BuildCrew Sprint to see your team and start building.",
    },
  )));

  revalidatePath("/sprint");
  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  return { success: true, crewId: outcome.crewId };
}

export async function createSprintAnnouncement(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = sprintAnnouncementCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the announcement." };

  await db.insert(sprintAnnouncements).values({
    challengeId: parsed.data.challengeId,
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    createdBy: admin.id,
  });

  const rows = await db.select({
    userId: challengeParticipants.userId,
    crewId: challengeParticipants.crewId,
    status: challengeParticipants.participantStatus,
  }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, parsed.data.challengeId));

  const recipients = rows.filter((item) => {
    if (parsed.data.audience === "ALL") return !["REJECTED", "DROPPED"].includes(item.status);
    if (parsed.data.audience === "UNMATCHED") return !item.crewId && ["APPLIED", "ACCEPTED", "WAITLIST"].includes(item.status);
    return ["ACCEPTED", "MATCHED", "BUILDING", "COMPLETED"].includes(item.status);
  });

  await Promise.all(recipients.map((item) => createNotification(
    item.userId,
    "CHALLENGE_UPDATE",
    parsed.data.title,
    parsed.data.body,
    "/sprint/apply",
    {
      entityType: "challenge",
      entityId: parsed.data.challengeId,
      emailPreference: "emailChallenge",
      titleEn: parsed.data.title,
      bodyEn: parsed.data.body,
    },
  )));

  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  return { success: true, recipients: recipients.length };
}

export async function submitSprintCheckIn(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = sprintCheckInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the check-in." };

  const [challengeRows, participantRows] = await Promise.all([
    db.select({ startsAt: buildChallenges.startsAt, status: buildChallenges.status })
      .from(buildChallenges).where(eq(buildChallenges.id, parsed.data.challengeId)).limit(1),
    db.select({ status: challengeParticipants.participantStatus })
      .from(challengeParticipants).where(and(
        eq(challengeParticipants.challengeId, parsed.data.challengeId),
        eq(challengeParticipants.userId, user.id),
      )).limit(1),
  ]);
  const challenge = challengeRows[0];
  const participant = participantRows[0];
  if (!challenge || !participant) return { error: "Sprint participation not found." };
  if (!["MATCHED", "BUILDING"].includes(participant.status)) return { error: "Check-ins are available after Crew matching." };

  const daysSinceStart = Math.max(0, Math.floor((Date.now() - challenge.startsAt.getTime()) / (24 * 60 * 60 * 1000)));
  const weekKey = `week-${Math.floor(daysSinceStart / 7) + 1}`;

  await db.insert(sprintCheckIns).values({
    challengeId: parsed.data.challengeId,
    userId: user.id,
    weekKey,
    health: parsed.data.health,
    note: parsed.data.note?.trim() || null,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [sprintCheckIns.challengeId, sprintCheckIns.userId, sprintCheckIns.weekKey],
    set: {
      health: parsed.data.health,
      note: parsed.data.note?.trim() || null,
      updatedAt: new Date(),
    },
  });

  await db.update(challengeParticipants).set({
    participantStatus: participant.status === "MATCHED" ? "BUILDING" : participant.status,
    updatedAt: new Date(),
  }).where(and(
    eq(challengeParticipants.challengeId, parsed.data.challengeId),
    eq(challengeParticipants.userId, user.id),
  ));

  revalidatePath("/sprint/apply");
  revalidatePath("/admin/challenges");
  return { success: true };
}

