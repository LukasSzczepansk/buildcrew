"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  hackathonParticipants,
  hackathons,
  hackathonTeamInvites,
  hackathonTeamMembers,
  hackathonTeamRequests,
  hackathonTeams,
  profiles,
  users
} from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { getHackathonPhase, slugifyHackathonName } from "@/lib/hackathons";
import { selectComplementaryHackathonMatches } from "@/lib/hackathon-matching";
import { enforceUserRateLimit } from "@/lib/security";
import {
  hackathonAdminSchema,
  hackathonDecisionSchema,
  hackathonJoinSchema,
  hackathonTeamCreateSchema,
  hackathonTeamInviteSchema,
  hackathonTeamRequestSchema,
  uuidSchema,
} from "@/lib/validations";
import { listHackathonMatches } from "@/server/data/hackathons";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

async function requireAdmin() {
  const user = await getVerifiedCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) return null;
  return user;
}

function normalizeNullable(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateHackathon(slug: string) {
  revalidatePath("/hackathons");
  revalidatePath(`/hackathons/${slug}`);
  revalidatePath("/explore/hackathons");
  revalidatePath(`/explore/hackathons/${slug}`);
}

async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugifyHackathonName(name);
  const existing = await db.select({ id: hackathons.id }).from(hackathons).where(eq(hackathons.slug, base)).limit(1);
  if (!existing[0] || existing[0].id === ignoreId) return base;
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

async function getOpenHackathon(id: string) {
  if (!uuidSchema.safeParse(id).success) return null;
  const rows = await db.select().from(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.isPublished, true))).limit(1);
  const event = rows[0];
  if (!event || getHackathonPhase(event) !== "TEAM_FORMING") return null;
  return event;
}

export async function createHackathon(input: unknown) {
  const admin = await requireAdmin();
  if (!admin) return { error: "You do not have permission to do this." };
  const parsed = hackathonAdminSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const slug = await uniqueSlug(parsed.data.name);
  const [created] = await db.insert(hackathons).values({
    slug,
    name: parsed.data.name,
    summary: parsed.data.summary,
    description: normalizeNullable(parsed.data.description),
    organizerName: normalizeNullable(parsed.data.organizerName),
    organizerUrl: normalizeNullable(parsed.data.organizerUrl),
    officialUrl: parsed.data.officialUrl,
    registrationUrl: normalizeNullable(parsed.data.registrationUrl),
    locationType: parsed.data.locationType,
    city: normalizeNullable(parsed.data.city),
    venue: normalizeNullable(parsed.data.venue),
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    registrationDeadline: parsed.data.registrationDeadline instanceof Date ? parsed.data.registrationDeadline : null,
    minTeamSize: parsed.data.minTeamSize,
    maxTeamSize: parsed.data.maxTeamSize,
    themes: parsed.data.themes,
    coverImageUrl: normalizeNullable(parsed.data.coverImageUrl),
    mediaRightsConfirmed: parsed.data.mediaRightsConfirmed,
    isPartner: parsed.data.isPartner,
    isCancelled: parsed.data.isCancelled,
    isPublished: parsed.data.isPublished,
    createdBy: admin.id,
  }).returning({ id: hackathons.id, slug: hackathons.slug });
  revalidatePath("/admin/hackathons");
  revalidateHackathon(created.slug);
  return { success: true, id: created.id, slug: created.slug };
}

export async function updateHackathon(id: string, input: unknown) {
  const admin = await requireAdmin();
  if (!admin || !uuidSchema.safeParse(id).success) return { error: "You do not have permission or the data is invalid." };
  const parsed = hackathonAdminSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const current = await db.select({ id: hackathons.id, slug: hackathons.slug }).from(hackathons).where(eq(hackathons.id, id)).limit(1);
  if (!current[0]) return { error: "Hackathon not found." };
  await db.update(hackathons).set({
    name: parsed.data.name,
    summary: parsed.data.summary,
    description: normalizeNullable(parsed.data.description),
    organizerName: normalizeNullable(parsed.data.organizerName),
    organizerUrl: normalizeNullable(parsed.data.organizerUrl),
    officialUrl: parsed.data.officialUrl,
    registrationUrl: normalizeNullable(parsed.data.registrationUrl),
    locationType: parsed.data.locationType,
    city: normalizeNullable(parsed.data.city),
    venue: normalizeNullable(parsed.data.venue),
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    registrationDeadline: parsed.data.registrationDeadline instanceof Date ? parsed.data.registrationDeadline : null,
    minTeamSize: parsed.data.minTeamSize,
    maxTeamSize: parsed.data.maxTeamSize,
    themes: parsed.data.themes,
    coverImageUrl: normalizeNullable(parsed.data.coverImageUrl),
    mediaRightsConfirmed: parsed.data.mediaRightsConfirmed,
    isPartner: parsed.data.isPartner,
    isCancelled: parsed.data.isCancelled,
    isPublished: parsed.data.isPublished,
    updatedAt: new Date(),
  }).where(eq(hackathons.id, id));
  revalidatePath("/admin/hackathons");
  revalidateHackathon(current[0].slug);
  return { success: true };
}

export async function saveHackathonParticipation(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:hackathon:join", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = hackathonJoinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const event = await getOpenHackathon(parsed.data.hackathonId);
  if (!event) return { error: "Team matching for this hackathon is closed." };
  if (parsed.data.preferredTeamSize < event.minTeamSize || parsed.data.preferredTeamSize > event.maxTeamSize) {
    return { error: `Teams for this event must have ${event.minTeamSize}–${event.maxTeamSize} people.` };
  }
  const membership = await db.select({ teamId: hackathonTeamMembers.teamId }).from(hackathonTeamMembers)
    .where(and(eq(hackathonTeamMembers.hackathonId, event.id), eq(hackathonTeamMembers.userId, user.id))).limit(1);
  const status = membership[0] ? "IN_TEAM" as const : "LOOKING" as const;
  await db.insert(hackathonParticipants).values({
    hackathonId: event.id,
    userId: user.id,
    role: parsed.data.role,
    technologies: parsed.data.technologies,
    themes: parsed.data.themes,
    hasIdea: parsed.data.hasIdea,
    ideaSummary: parsed.data.hasIdea ? normalizeNullable(parsed.data.ideaSummary) : null,
    goal: parsed.data.goal,
    availability: parsed.data.availability,
    preferredTeamSize: parsed.data.preferredTeamSize,
    status,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [hackathonParticipants.hackathonId, hackathonParticipants.userId],
    set: {
      role: parsed.data.role,
      technologies: parsed.data.technologies,
      themes: parsed.data.themes,
      hasIdea: parsed.data.hasIdea,
      ideaSummary: parsed.data.hasIdea ? normalizeNullable(parsed.data.ideaSummary) : null,
      goal: parsed.data.goal,
      availability: parsed.data.availability,
      preferredTeamSize: parsed.data.preferredTeamSize,
      status,
      updatedAt: new Date(),
    },
  });
  await logEvent("hackathon_joined", user.id, { hackathonId: event.id });
  revalidateHackathon(event.slug);
  return { success: true };
}

export async function pauseHackathonMatching(hackathonId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(hackathonId).success) return { error: "Invalid data." };
  const membership = await db.select({ id: hackathonTeamMembers.teamId }).from(hackathonTeamMembers)
    .where(and(eq(hackathonTeamMembers.hackathonId, hackathonId), eq(hackathonTeamMembers.userId, user.id))).limit(1);
  if (membership[0]) return { error: "You are already on a team. Your looking-for-team status is not active." };
  await db.update(hackathonParticipants).set({ status: "PAUSED", updatedAt: new Date() })
    .where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.userId, user.id)));
  const event = await db.select({ slug: hackathons.slug }).from(hackathons).where(eq(hackathons.id, hackathonId)).limit(1);
  if (event[0]) revalidateHackathon(event[0].slug);
  return { success: true };
}

export async function createHackathonTeam(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:hackathon:team:create", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = hackathonTeamCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the team details." };
  const event = await getOpenHackathon(parsed.data.hackathonId);
  if (!event) return { error: "Team formation is already closed." };
  if (parsed.data.targetSize < event.minTeamSize || parsed.data.targetSize > event.maxTeamSize) return { error: "Invalid team size." };

  try {
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${event.id}:${user.id}`}))`);
      const participantRows = await tx.select().from(hackathonParticipants).where(and(eq(hackathonParticipants.hackathonId, event.id), eq(hackathonParticipants.userId, user.id))).limit(1);
      const participant = participantRows[0];
      if (!participant) return { error: "Join the participant pool first." } as const;
      const memberRows = await tx.select({ teamId: hackathonTeamMembers.teamId }).from(hackathonTeamMembers).where(and(eq(hackathonTeamMembers.hackathonId, event.id), eq(hackathonTeamMembers.userId, user.id))).limit(1);
      if (memberRows[0]) return { error: "You already have a team for this hackathon." } as const;
      const [team] = await tx.insert(hackathonTeams).values({
        hackathonId: event.id,
        name: parsed.data.name,
        createdBy: user.id,
        ideaTitle: normalizeNullable(parsed.data.ideaTitle),
        ideaSummary: normalizeNullable(parsed.data.ideaSummary),
        targetSize: parsed.data.targetSize,
      }).returning();
      await tx.insert(hackathonTeamMembers).values({ teamId: team.id, hackathonId: event.id, userId: user.id, role: participant.role, isLead: true });
      await tx.update(hackathonParticipants).set({ status: "IN_TEAM", updatedAt: new Date() }).where(and(eq(hackathonParticipants.hackathonId, event.id), eq(hackathonParticipants.userId, user.id)));
      return { teamId: team.id } as const;
    });
    if ("error" in outcome) return outcome;
    await logEvent("hackathon_team_created", user.id, { hackathonId: event.id, teamId: outcome.teamId });
    revalidateHackathon(event.slug);
    return { success: true, teamId: outcome.teamId };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "You already have a team for this hackathon." };
    throw error;
  }
}

export async function createSuggestedHackathonTeam(hackathonId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(hackathonId).success) return { error: "Invalid data." };
  const rateError = await enforceUserRateLimit("action:hackathon:team:suggest", user.id, 5, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const event = await getOpenHackathon(hackathonId);
  if (!event) return { error: "Team formation is already closed." };
  const [participantRows, profileRows] = await Promise.all([
    db.select().from(hackathonParticipants).where(and(eq(hackathonParticipants.hackathonId, event.id), eq(hackathonParticipants.userId, user.id))).limit(1),
    db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1),
  ]);
  const participant = participantRows[0];
  if (!participant || participant.status !== "LOOKING") return { error: "You must be actively looking for a team." };
  const matches = await listHackathonMatches(event.id, user.id);
  if (!matches.length) return { error: "There are not enough matching people yet. Try again later or create a team manually." };
  const targetSize = Math.min(event.maxTeamSize, Math.max(event.minTeamSize, participant.preferredTeamSize));
  const selected = selectComplementaryHackathonMatches(matches, participant.role, Math.max(1, targetSize - 1));

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${event.id}:${user.id}`}))`);
    const existing = await tx.select({ teamId: hackathonTeamMembers.teamId }).from(hackathonTeamMembers)
      .where(and(eq(hackathonTeamMembers.hackathonId, event.id), eq(hackathonTeamMembers.userId, user.id))).limit(1);
    if (existing[0]) return { error: "You already have a team for this hackathon." } as const;
    const [team] = await tx.insert(hackathonTeams).values({
      hackathonId: event.id,
      name: `Team ${profileRows[0]?.username ?? "BuildCrew"}`.slice(0, 60),
      createdBy: user.id,
      ideaSummary: participant.hasIdea ? participant.ideaSummary : null,
      targetSize,
    }).returning();
    await tx.insert(hackathonTeamMembers).values({ teamId: team.id, hackathonId: event.id, userId: user.id, role: participant.role, isLead: true });
    await tx.update(hackathonParticipants).set({ status: "IN_TEAM", updatedAt: new Date() }).where(and(eq(hackathonParticipants.hackathonId, event.id), eq(hackathonParticipants.userId, user.id)));
    for (const candidate of selected) {
      await tx.insert(hackathonTeamInvites).values({
        teamId: team.id,
        hackathonId: event.id,
        inviterId: user.id,
        inviteeId: candidate.userId,
        message: "BuildCrew suggested us as a complementary team for this hackathon.",
      }).onConflictDoNothing();
    }
    return { teamId: team.id } as const;
  });
  if ("error" in outcome) return outcome;

  await Promise.all(selected.map((candidate) => createNotification(
    candidate.userId,
    "HACKATHON_TEAM_INVITE",
    `${profileRows[0]?.username ?? "Someone"} invited you to a team for ${event.name}`,
    "BuildCrew matched you based on role, interests and availability. Review the team and decide whether you want to join.",
    `/hackathons/${event.slug}`,
    {
      actorId: user.id,
      entityType: "hackathon",
      entityId: event.id,
      emailPreference: "emailChallenge",
      emailCtaLabel: "View team",
      emailCtaLabelEn: "View team",
      titleEn: `${profileRows[0]?.username ?? "Someone"} invited you to a team for ${event.name}`,
      bodyEn: "BuildCrew matched you based on role, direction and availability. Review the team and decide whether you want to join.",
    },
  )));
  await logEvent("hackathon_team_created", user.id, { hackathonId: event.id, teamId: outcome.teamId, suggested: true, invited: selected.length });
  revalidateHackathon(event.slug);
  return { success: true, teamId: outcome.teamId, invited: selected.length };
}

export async function inviteToHackathonTeam(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:hackathon:team:invite", user.id, 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = hackathonTeamInviteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid invitation." };
  if (parsed.data.inviteeId === user.id) return { error: "You cannot invite yourself." };
  if (await isBlockedEitherWay(user.id, parsed.data.inviteeId)) return { error: "This person cannot be invited." };
  const rows = await db.select({ team: hackathonTeams, isLead: hackathonTeamMembers.isLead, eventSlug: hackathons.slug, eventName: hackathons.name })
    .from(hackathonTeamMembers)
    .innerJoin(hackathonTeams, eq(hackathonTeams.id, hackathonTeamMembers.teamId))
    .innerJoin(hackathons, eq(hackathons.id, hackathonTeams.hackathonId))
    .where(and(eq(hackathonTeamMembers.teamId, parsed.data.teamId), eq(hackathonTeamMembers.userId, user.id))).limit(1);
  const row = rows[0];
  if (!row || !row.isLead) return { error: "Only the team lead can send invitations." };
  const event = await getOpenHackathon(row.team.hackathonId);
  if (!event) return { error: "Team formation is closed." };
  const [countRows, candidateRows, alreadyMember] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(hackathonTeamMembers).where(eq(hackathonTeamMembers.teamId, row.team.id)),
    db.select({ userId: hackathonParticipants.userId }).from(hackathonParticipants).innerJoin(users, eq(users.id, hackathonParticipants.userId))
      .where(and(eq(hackathonParticipants.hackathonId, event.id), eq(hackathonParticipants.userId, parsed.data.inviteeId), eq(hackathonParticipants.status, "LOOKING"), eq(users.isSuspended, false), eq(users.systemRole, "USER"))).limit(1),
    db.select({ teamId: hackathonTeamMembers.teamId }).from(hackathonTeamMembers).where(and(eq(hackathonTeamMembers.hackathonId, event.id), eq(hackathonTeamMembers.userId, parsed.data.inviteeId))).limit(1),
  ]);
  if ((countRows[0]?.count ?? 0) >= row.team.targetSize) return { error: "The team is already full." };
  if (!candidateRows[0] || alreadyMember[0]) return { error: "This person is no longer looking for a team for this hackathon." };
  try {
    await db.insert(hackathonTeamInvites).values({
      teamId: row.team.id,
      hackathonId: event.id,
      inviterId: user.id,
      inviteeId: parsed.data.inviteeId,
      message: normalizeNullable(parsed.data.message),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "This person already has a pending invitation to your team." };
    throw error;
  }
  await createNotification(parsed.data.inviteeId, "HACKATHON_TEAM_INVITE", `Invitation to ${row.team.name} for ${row.eventName}`, parsed.data.message || "Review the team and decide whether you want to join.", `/hackathons/${row.eventSlug}`, {
    actorId: user.id,
    entityType: "hackathon",
    entityId: event.id,
    emailPreference: "emailChallenge",
    emailCtaLabel: "View invitation",
    emailCtaLabelEn: "View invitation",
    titleEn: `Invitation to ${row.team.name} for ${row.eventName}`,
    bodyEn: parsed.data.message || "Review the team and decide whether you want to join.",
  });
  await logEvent("hackathon_team_invite_sent", user.id, { hackathonId: event.id, teamId: row.team.id, inviteeId: parsed.data.inviteeId });
  revalidateHackathon(event.slug);
  return { success: true };
}

async function acceptPersonIntoTeam(tx: any, params: { teamId: string; hackathonId: string; userId: string; role: typeof hackathonParticipants.$inferSelect["role"] }) {
  await tx.execute(sql`select id from hackathon_teams where id = ${params.teamId} for update`);
  const teamRows = await tx.select().from(hackathonTeams).where(eq(hackathonTeams.id, params.teamId)).limit(1);
  const team = teamRows[0];
  if (!team || team.status === "ARCHIVED") return { error: "The team is no longer available." } as const;
  const existing = await tx.select({ teamId: hackathonTeamMembers.teamId }).from(hackathonTeamMembers)
    .where(and(eq(hackathonTeamMembers.hackathonId, params.hackathonId), eq(hackathonTeamMembers.userId, params.userId))).limit(1);
  if (existing[0]) return { error: "You are already on a team for this hackathon." } as const;
  const countRows = await tx.select({ count: sql<number>`count(*)::int` }).from(hackathonTeamMembers).where(eq(hackathonTeamMembers.teamId, params.teamId));
  if ((countRows[0]?.count ?? 0) >= team.targetSize) return { error: "The team is already full." } as const;
  await tx.insert(hackathonTeamMembers).values({ teamId: params.teamId, hackathonId: params.hackathonId, userId: params.userId, role: params.role, isLead: false });
  await tx.update(hackathonParticipants).set({ status: "IN_TEAM", updatedAt: new Date() }).where(and(eq(hackathonParticipants.hackathonId, params.hackathonId), eq(hackathonParticipants.userId, params.userId)));
  const newCount = (countRows[0]?.count ?? 0) + 1;
  if (newCount >= team.targetSize) await tx.update(hackathonTeams).set({ status: "FULL", updatedAt: new Date() }).where(eq(hackathonTeams.id, params.teamId));
  await tx.update(hackathonTeamInvites).set({ status: "REJECTED", respondedAt: new Date() }).where(and(eq(hackathonTeamInvites.hackathonId, params.hackathonId), eq(hackathonTeamInvites.inviteeId, params.userId), eq(hackathonTeamInvites.status, "PENDING"), ne(hackathonTeamInvites.teamId, params.teamId)));
  await tx.update(hackathonTeamRequests).set({ status: "REJECTED", respondedAt: new Date() }).where(and(eq(hackathonTeamRequests.hackathonId, params.hackathonId), eq(hackathonTeamRequests.applicantId, params.userId), eq(hackathonTeamRequests.status, "PENDING"), ne(hackathonTeamRequests.teamId, params.teamId)));
  return { team } as const;
}

export async function respondHackathonTeamInvite(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = hackathonDecisionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid data." };
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from hackathon_team_invites where id = ${parsed.data.id} for update`);
    const inviteRows = await tx.select().from(hackathonTeamInvites).where(eq(hackathonTeamInvites.id, parsed.data.id)).limit(1);
    const invite = inviteRows[0];
    if (!invite || invite.inviteeId !== user.id || invite.status !== "PENDING") return { error: "The invitation is no longer active." } as const;
    if (parsed.data.decision === "REJECTED") {
      await tx.update(hackathonTeamInvites).set({ status: "REJECTED", respondedAt: new Date() }).where(eq(hackathonTeamInvites.id, invite.id));
      return { invite, accepted: false, team: null } as const;
    }
    const eventRows = await tx.select({ startsAt: hackathons.startsAt, endsAt: hackathons.endsAt, registrationDeadline: hackathons.registrationDeadline, isCancelled: hackathons.isCancelled, isPublished: hackathons.isPublished }).from(hackathons).where(eq(hackathons.id, invite.hackathonId)).limit(1);
    if (!eventRows[0]?.isPublished || getHackathonPhase(eventRows[0]) !== "TEAM_FORMING") return { error: "Team formation for this event is already closed." } as const;
    if (await isBlockedEitherWay(invite.inviterId, user.id)) return { error: "This invitation cannot be accepted." } as const;
    const participantRows = await tx.select({ role: hackathonParticipants.role }).from(hackathonParticipants).where(and(eq(hackathonParticipants.hackathonId, invite.hackathonId), eq(hackathonParticipants.userId, user.id))).limit(1);
    if (!participantRows[0]) return { error: "Join this hackathon participant pool first." } as const;
    const joined = await acceptPersonIntoTeam(tx, { teamId: invite.teamId, hackathonId: invite.hackathonId, userId: user.id, role: participantRows[0].role });
    if ("error" in joined && joined.error) return { error: joined.error } as const;
    if (!("team" in joined) || !joined.team) return { error: "Could not join the team." } as const;
    await tx.update(hackathonTeamInvites).set({ status: "ACCEPTED", respondedAt: new Date() }).where(eq(hackathonTeamInvites.id, invite.id));
    return { invite, accepted: true, team: joined.team } as const;
  });
  if ("error" in outcome) return outcome;
  const event = await db.select({ slug: hackathons.slug, name: hackathons.name }).from(hackathons).where(eq(hackathons.id, outcome.invite.hackathonId)).limit(1);
  if (event[0]) revalidateHackathon(event[0].slug);
  if (outcome.accepted && outcome.team) {
    await createNotification(outcome.invite.inviterId, "HACKATHON_TEAM_JOINED", `${user.username ?? "A new member"} is joining ${outcome.team.name}`, `Your team for ${event[0]?.name ?? "the hackathon"} has a new member.`, event[0] ? `/hackathons/${event[0].slug}` : "/hackathons", {
      actorId: user.id,
      entityType: "hackathon",
      entityId: outcome.invite.hackathonId,
      emailPreference: "emailChallenge",
      titleEn: `${user.username ?? "A new member"} is joining ${outcome.team.name}`,
      bodyEn: `Your team for ${event[0]?.name ?? "the hackathon"} has a new member.`,
    });
    await logEvent("hackathon_team_joined", user.id, { hackathonId: outcome.invite.hackathonId, teamId: outcome.team.id, source: "invite" });
  }
  return { success: true };
}

export async function requestToJoinHackathonTeam(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:hackathon:team:request", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = hackathonTeamRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const rows = await db.select({
    team: hackathonTeams,
    slug: hackathons.slug,
    eventName: hackathons.name,
    startsAt: hackathons.startsAt,
    endsAt: hackathons.endsAt,
    registrationDeadline: hackathons.registrationDeadline,
    isCancelled: hackathons.isCancelled,
    isPublished: hackathons.isPublished,
  })
    .from(hackathonTeams).innerJoin(hackathons, eq(hackathons.id, hackathonTeams.hackathonId)).where(eq(hackathonTeams.id, parsed.data.teamId)).limit(1);
  const row = rows[0];
  if (!row || !row.isPublished || getHackathonPhase(row) !== "TEAM_FORMING") return { error: "This team is no longer accepting requests." };
  const participant = await db.select({ role: hackathonParticipants.role, status: hackathonParticipants.status }).from(hackathonParticipants)
    .where(and(eq(hackathonParticipants.hackathonId, row.team.hackathonId), eq(hackathonParticipants.userId, user.id))).limit(1);
  if (!participant[0] || participant[0].status !== "LOOKING") return { error: "You must be actively looking for a team for this hackathon." };
  const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(hackathonTeamMembers).where(eq(hackathonTeamMembers.teamId, row.team.id));
  if ((countRows[0]?.count ?? 0) >= row.team.targetSize) return { error: "The team is already full." };
  const leadRows = await db.select({ userId: hackathonTeamMembers.userId }).from(hackathonTeamMembers).where(and(eq(hackathonTeamMembers.teamId, row.team.id), eq(hackathonTeamMembers.isLead, true)));
  if (leadRows.some((lead) => lead.userId !== user.id) && (await Promise.all(leadRows.map((lead) => isBlockedEitherWay(user.id, lead.userId)))).some(Boolean)) return { error: "You cannot send a request to this team." };
  try {
    await db.insert(hackathonTeamRequests).values({ teamId: row.team.id, hackathonId: row.team.hackathonId, applicantId: user.id, message: normalizeNullable(parsed.data.message) });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Your request is already pending." };
    throw error;
  }
  const leads = leadRows;
  await Promise.all(leads.map((lead) => createNotification(lead.userId, "HACKATHON_TEAM_REQUEST", `${user.username ?? "Someone"} wants to join ${row.team.name}`, parsed.data.message || "Review the profile and decide whether they fit your team.", `/hackathons/${row.slug}`, {
    actorId: user.id,
    entityType: "hackathon",
    entityId: row.team.hackathonId,
    emailPreference: "emailChallenge",
    emailCtaLabel: "View request",
    emailCtaLabelEn: "Review request",
    titleEn: `${user.username ?? "Someone"} wants to join ${row.team.name}`,
    bodyEn: parsed.data.message || "Review their profile and decide whether they are a good fit for your team.",
  })));
  revalidateHackathon(row.slug);
  return { success: true };
}

export async function respondHackathonTeamRequest(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = hackathonDecisionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid data." };
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from hackathon_team_requests where id = ${parsed.data.id} for update`);
    const requestRows = await tx.select().from(hackathonTeamRequests).where(eq(hackathonTeamRequests.id, parsed.data.id)).limit(1);
    const request = requestRows[0];
    if (!request || request.status !== "PENDING") return { error: "The request is no longer active." } as const;
    const lead = await tx.select({ userId: hackathonTeamMembers.userId }).from(hackathonTeamMembers).where(and(eq(hackathonTeamMembers.teamId, request.teamId), eq(hackathonTeamMembers.userId, user.id), eq(hackathonTeamMembers.isLead, true))).limit(1);
    if (!lead[0]) return { error: "Only the team lead can review requests." } as const;
    if (parsed.data.decision === "REJECTED") {
      await tx.update(hackathonTeamRequests).set({ status: "REJECTED", respondedAt: new Date() }).where(eq(hackathonTeamRequests.id, request.id));
      return { request, accepted: false, team: null } as const;
    }
    const eventRows = await tx.select({ startsAt: hackathons.startsAt, endsAt: hackathons.endsAt, registrationDeadline: hackathons.registrationDeadline, isCancelled: hackathons.isCancelled, isPublished: hackathons.isPublished }).from(hackathons).where(eq(hackathons.id, request.hackathonId)).limit(1);
    if (!eventRows[0]?.isPublished || getHackathonPhase(eventRows[0]) !== "TEAM_FORMING") return { error: "Team formation for this event is already closed." } as const;
    if (await isBlockedEitherWay(user.id, request.applicantId)) return { error: "This request cannot be accepted." } as const;
    const participant = await tx.select({ role: hackathonParticipants.role }).from(hackathonParticipants).where(and(eq(hackathonParticipants.hackathonId, request.hackathonId), eq(hackathonParticipants.userId, request.applicantId))).limit(1);
    if (!participant[0]) return { error: "This person is no longer in the event participant pool." } as const;
    const joined = await acceptPersonIntoTeam(tx, { teamId: request.teamId, hackathonId: request.hackathonId, userId: request.applicantId, role: participant[0].role });
    if ("error" in joined && joined.error) return { error: joined.error } as const;
    if (!("team" in joined) || !joined.team) return { error: "Could not add this person to the team." } as const;
    await tx.update(hackathonTeamRequests).set({ status: "ACCEPTED", respondedAt: new Date() }).where(eq(hackathonTeamRequests.id, request.id));
    return { request, accepted: true, team: joined.team } as const;
  });
  if ("error" in outcome) return outcome;
  const event = await db.select({ slug: hackathons.slug, name: hackathons.name }).from(hackathons).where(eq(hackathons.id, outcome.request.hackathonId)).limit(1);
  if (event[0]) revalidateHackathon(event[0].slug);
  if (outcome.accepted && outcome.team) {
    await createNotification(outcome.request.applicantId, "HACKATHON_TEAM_JOINED", `You are joining ${outcome.team.name}`, `Your request to join the team for ${event[0]?.name ?? "the hackathon"} was accepted.`, event[0] ? `/hackathons/${event[0].slug}` : "/hackathons", {
      actorId: user.id,
      entityType: "hackathon",
      entityId: outcome.request.hackathonId,
      emailPreference: "emailChallenge",
      titleEn: `You're joining ${outcome.team.name}`,
      bodyEn: `Your request to join the team for ${event[0]?.name ?? "the hackathon"} was accepted.`,
    });
    await logEvent("hackathon_team_joined", outcome.request.applicantId, { hackathonId: outcome.request.hackathonId, teamId: outcome.team.id, source: "request" });
  }
  return { success: true };
}

export async function leaveHackathonTeam(teamId: string) {
  const user = await getVerifiedCurrentUser();
  if (!user || !uuidSchema.safeParse(teamId).success) return { error: "Invalid data." };
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from hackathon_teams where id = ${teamId} for update`);
    const memberRows = await tx.select({ member: hackathonTeamMembers, team: hackathonTeams })
      .from(hackathonTeamMembers).innerJoin(hackathonTeams, eq(hackathonTeams.id, hackathonTeamMembers.teamId))
      .where(and(eq(hackathonTeamMembers.teamId, teamId), eq(hackathonTeamMembers.userId, user.id))).limit(1);
    const row = memberRows[0];
    if (!row) return { error: "You are not a member of this team." } as const;
    const countRows = await tx.select({ count: sql<number>`count(*)::int` }).from(hackathonTeamMembers).where(eq(hackathonTeamMembers.teamId, teamId));
    const count = countRows[0]?.count ?? 0;
    if (row.member.isLead && count > 1) return { error: "The team lead cannot leave an active team that still has other members." } as const;
    await tx.delete(hackathonTeamMembers).where(and(eq(hackathonTeamMembers.teamId, teamId), eq(hackathonTeamMembers.userId, user.id)));
    if (count <= 1) {
      await tx.update(hackathonTeams).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(hackathonTeams.id, teamId));
    } else {
      await tx.update(hackathonTeams).set({ status: "FORMING", updatedAt: new Date() }).where(eq(hackathonTeams.id, teamId));
    }
    await tx.update(hackathonParticipants).set({ status: "LOOKING", updatedAt: new Date() }).where(and(eq(hackathonParticipants.hackathonId, row.team.hackathonId), eq(hackathonParticipants.userId, user.id)));
    return { hackathonId: row.team.hackathonId } as const;
  });
  if ("error" in outcome) return outcome;
  const event = await db.select({ slug: hackathons.slug }).from(hackathons).where(eq(hackathons.id, outcome.hackathonId)).limit(1);
  if (event[0]) revalidateHackathon(event[0].slug);
  return { success: true };
}
