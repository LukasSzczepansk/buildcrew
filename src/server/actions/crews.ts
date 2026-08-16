"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { buildChallenges, buildPoolListings, buildProposals, challengeParticipants, crewInvites, crewMembers, crews, profiles, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { buildProposalSchema, crewInviteSchema, decisionSchema, uuidSchema } from "@/lib/validations";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { getMembershipCrewForUser } from "@/server/data/crews";
import { createNotification } from "@/server/services/notifications";

const MAX_CREW_SIZE = 4;

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

export async function sendBuildProposal(receiverId: string, message: string, challengeId?: string) {
  const parsed = buildProposalSchema.safeParse({ receiverId, message });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  receiverId = parsed.data.receiverId;
  message = parsed.data.message ?? "";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:build-proposal", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (user.id === receiverId) return { error: "You cannot invite yourself." };
  if (challengeId && !uuidSchema.safeParse(challengeId).success) return { error: "Invalid challenge." };
  const receiverRows = await db.select({ id: users.id, isSuspended: users.isSuspended, systemRole: users.systemRole, onboardingCompleted: profiles.onboardingCompleted })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, receiverId)).limit(1);
  const receiver = receiverRows[0];
  if (!receiver || receiver.isSuspended || receiver.systemRole === "ADMIN" || !receiver.onboardingCompleted) return { error: "This person is not available." };
  if (challengeId) {
    const [challengeRows, participantRows] = await Promise.all([
      db.select({ id: buildChallenges.id, status: buildChallenges.status }).from(buildChallenges).where(eq(buildChallenges.id, challengeId)).limit(1),
      db.select({ userId: challengeParticipants.userId }).from(challengeParticipants).where(and(eq(challengeParticipants.challengeId, challengeId), inArray(challengeParticipants.userId, [user.id, receiverId]))),
    ]);
    if (!challengeRows[0] || !["OPEN", "BUILDING"].includes(challengeRows[0].status)) return { error: "This challenge is no longer accepting new crews." };
    if (participantRows.length !== 2) return { error: "Both people must be registered for this challenge." };
  } else {
    const activeListing = await db.select({ id: buildPoolListings.id }).from(buildPoolListings).where(and(eq(buildPoolListings.userId, receiverId), eq(buildPoolListings.status, "ACTIVE"))).limit(1);
    if (!activeListing[0]) return { error: "This person no longer has an active Build Pool listing." };
  }
  if (await isBlockedEitherWay(user.id, receiverId)) return { error: "You cannot send a proposal to this person." };

  try {
    const outcome = await db.transaction(async (tx) => {
      const pairKey = [user.id, receiverId].sort().join(":");
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairKey}))`);

      const memberships = await tx
        .select({ userId: crewMembers.userId, status: crews.status })
        .from(crewMembers)
        .innerJoin(crews, eq(crews.id, crewMembers.crewId))
        .where(inArray(crewMembers.userId, [user.id, receiverId]));
      if (memberships.some((m) => m.userId === user.id && m.status === "FORMING")) return { error: "You already have a crew. Invite this person directly to it." } as const;
      if (memberships.some((m) => m.userId === receiverId && m.status === "FORMING")) return { error: "This person is already in a crew." } as const;

      const existing = await tx.select({ id: buildProposals.id }).from(buildProposals).where(and(
        eq(buildProposals.status, "PENDING"),
        or(
          and(eq(buildProposals.senderId, user.id), eq(buildProposals.receiverId, receiverId)),
          and(eq(buildProposals.senderId, receiverId), eq(buildProposals.receiverId, user.id)),
        ),
      )).limit(1);
      if (existing.length) return { error: "There is already a pending proposal between you." } as const;

      await tx.insert(buildProposals).values({ senderId: user.id, receiverId, message: message.trim().slice(0, 300) || null, challengeId: challengeId ?? null });
      return { success: true } as const;
    });
    if ("error" in outcome) return outcome;
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "This proposal is already pending." };
    throw error;
  }

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(receiverId, challengeId ? "CHALLENGE_MATCH" : "BUILD_PROPOSAL", `${profileRows[0]?.username ?? "Someone"} wants to build something with you`, message || (challengeId ? "A proposal to form a crew for a Build Challenge." : undefined), "/invitations", {
    actorId: user.id,
    entityType: challengeId ? "challenge" : "build_proposal",
    entityId: challengeId ?? undefined,
    emailPreference: "emailBuildPool",
    titleEn: `${profileRows[0]?.username ?? "Someone"} wants to build something with you`,
    bodyEn: message || (challengeId ? "A suggested team-up for the Build Challenge." : null),
  });
  await logEvent("crew_invite_sent", user.id, { receiverId, type: "build_proposal" });
  revalidatePath("/build");
  return { success: true };
}

export async function respondToBuildProposal(proposalId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(proposalId).success || !decisionSchema.safeParse(decision).success) return { error: "Invalid data." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from build_proposals where id = ${proposalId} for update`);
    const rows = await tx.select().from(buildProposals).where(eq(buildProposals.id, proposalId)).limit(1);
    const proposal = rows[0];
    if (!proposal) return { error: "Propozycja nie istnieje." } as const;
    if (proposal.receiverId !== user.id) return { error: "You do not have permission to do this." } as const;
    if (proposal.status !== "PENDING") return { error: "This proposal has already been reviewed." } as const;
    if (await isBlockedEitherWay(proposal.senderId, proposal.receiverId)) return { error: "This proposal cannot be accepted." } as const;

    const lockIds = [proposal.senderId, proposal.receiverId].sort();
    for (const id of lockIds) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);

    if (decision === "REJECTED") {
      await tx.update(buildProposals).set({ status: "REJECTED" }).where(and(eq(buildProposals.id, proposalId), eq(buildProposals.status, "PENDING")));
      return { proposal, crewId: null } as const;
    }

    const memberships = await tx.select({ userId: crewMembers.userId, crewId: crewMembers.crewId, status: crews.status })
      .from(crewMembers).innerJoin(crews, eq(crews.id, crewMembers.crewId))
      .where(inArray(crewMembers.userId, [proposal.senderId, proposal.receiverId]));
    if (memberships.some((m) => m.status === "FORMING")) return { error: "One of the people is already in an active crew." } as const;

    const [crew] = await tx.insert(crews).values({ createdBy: proposal.senderId, status: "FORMING" }).returning();
    await tx.insert(crewMembers).values([{ crewId: crew.id, userId: proposal.senderId }, { crewId: crew.id, userId: proposal.receiverId }]);
    await tx.update(buildProposals).set({ status: "ACCEPTED" }).where(and(eq(buildProposals.id, proposalId), eq(buildProposals.status, "PENDING")));
    await tx.update(buildPoolListings).set({ status: "PAUSED", updatedAt: new Date() }).where(inArray(buildPoolListings.userId, [proposal.senderId, proposal.receiverId]));
    if (proposal.challengeId) {
      await tx.update(challengeParticipants).set({ crewId: crew.id, mode: "HAS_CREW" }).where(and(eq(challengeParticipants.challengeId, proposal.challengeId), inArray(challengeParticipants.userId, [proposal.senderId, proposal.receiverId])));
    }
    return { proposal, crewId: crew.id } as const;
  });

  if ("error" in outcome) return outcome;
  if (decision === "ACCEPTED" && outcome.crewId) {
    await logEvent("crew_created", user.id, { crewId: outcome.crewId, members: [outcome.proposal.senderId, outcome.proposal.receiverId] });
    await logEvent("contact_revealed", user.id, { withUserId: outcome.proposal.senderId });
    await createNotification(outcome.proposal.senderId, "CREW_INVITE_ACCEPTED", "Your proposal was accepted! You now have a new crew 🎉", outcome.proposal.challengeId ? "You can now build a project together in the Build Challenge." : undefined, `/crews/${outcome.crewId}`, {
      actorId: user.id,
      entityType: "crew",
      entityId: outcome.crewId,
      emailPreference: "emailCrew",
      titleEn: "Your proposal was accepted! You have a new team 🎉",
      bodyEn: outcome.proposal.challengeId ? "You can now build together in the Build Challenge." : null,
    });
    revalidatePath("/build");
    return { success: true, crewId: outcome.crewId };
  }
  await createNotification(outcome.proposal.senderId, "CREW_INVITE_ACCEPTED", "Your proposal was not accepted this time.", undefined, "/build", {
    titleEn: "Your proposal was not accepted this time.",
  });
  revalidatePath("/build");
  return { success: true };
}

export async function inviteToCrew(crewId: string, inviteeId: string, message: string) {
  const parsed = crewInviteSchema.safeParse({ crewId, inviteeId, message });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  crewId = parsed.data.crewId;
  inviteeId = parsed.data.inviteeId;
  message = parsed.data.message ?? "";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:crew:invite", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (user.id === inviteeId) return { error: "You cannot invite yourself." };
  const inviteeRows = await db.select({ id: users.id, isSuspended: users.isSuspended, systemRole: users.systemRole, onboardingCompleted: profiles.onboardingCompleted })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, inviteeId)).limit(1);
  const invitee = inviteeRows[0];
  if (!invitee || invitee.isSuspended || invitee.systemRole === "ADMIN" || !invitee.onboardingCompleted) return { error: "This person is not available." };
  const activeListing = await db.select({ id: buildPoolListings.id }).from(buildPoolListings).where(and(eq(buildPoolListings.userId, inviteeId), eq(buildPoolListings.status, "ACTIVE"))).limit(1);
  if (!activeListing[0]) return { error: "This person no longer has an active Build Pool listing." };

  const crewRows = await db.select().from(crews).where(eq(crews.id, crewId)).limit(1);
  const crew = crewRows[0];
  if (!crew || crew.status !== "FORMING") return { error: "The crew is no longer active." };
  const members = await db.select().from(crewMembers).where(eq(crewMembers.crewId, crewId));
  if (!members.some((m) => m.userId === user.id)) return { error: "You are not a member of this crew." };
  if (members.length >= MAX_CREW_SIZE) return { error: "The crew has reached the maximum size of 4 people." };
  if (members.some((m) => m.userId === inviteeId)) return { error: "This person is already in a crew." };
  if (await getMembershipCrewForUser(inviteeId)) return { error: "This person is already in another crew." };
  if (await isBlockedEitherWay(user.id, inviteeId)) return { error: "This person cannot be invited." };

  try {
    await db.insert(crewInvites).values({ crewId, inviterId: user.id, inviteeId, message: message.trim().slice(0, 300) || null });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "This person already has a pending invitation to this crew." };
    throw error;
  }

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(inviteeId, "CREW_INVITE", `${profileRows[0]?.username ?? "Someone"} invited you to their crew`, message || undefined, "/invitations", {
    actorId: user.id,
    entityType: "crew",
    entityId: crewId,
    emailPreference: "emailCrew",
    titleEn: `${profileRows[0]?.username ?? "Someone"} invited you to their team`,
    bodyEn: message || null,
  });
  await logEvent("crew_invite_sent", user.id, { crewId, inviteeId, type: "crew_invite" });
  revalidatePath(`/crews/${crewId}`);
  return { success: true };
}

export async function respondToCrewInvite(inviteId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(inviteId).success || !decisionSchema.safeParse(decision).success) return { error: "Invalid data." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from crew_invites where id = ${inviteId} for update`);
    const rows = await tx.select().from(crewInvites).where(eq(crewInvites.id, inviteId)).limit(1);
    const invite = rows[0];
    if (!invite) return { error: "Invitation not found." } as const;
    if (invite.inviteeId !== user.id) return { error: "You do not have permission to do this." } as const;
    if (invite.status !== "PENDING") return { error: "This invitation has already been reviewed." } as const;
    if (await isBlockedEitherWay(user.id, invite.inviterId)) return { error: "This invitation cannot be accepted." } as const;
    if (decision === "REJECTED") {
      await tx.update(crewInvites).set({ status: "REJECTED" }).where(and(eq(crewInvites.id, inviteId), eq(crewInvites.status, "PENDING")));
      return { invite } as const;
    }

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);
    await tx.execute(sql`select id from crews where id = ${invite.crewId} for update`);
    const targetCrew = await tx.select().from(crews).where(eq(crews.id, invite.crewId)).limit(1);
    if (!targetCrew[0] || targetCrew[0].status !== "FORMING") return { error: "This crew is no longer active." } as const;
    const existing = await tx.select({ crewId: crewMembers.crewId, status: crews.status }).from(crewMembers).innerJoin(crews, eq(crews.id, crewMembers.crewId)).where(eq(crewMembers.userId, user.id));
    if (existing.some((m) => m.status === "FORMING")) return { error: "You are already in another active crew." } as const;
    const members = await tx.select({ userId: crewMembers.userId }).from(crewMembers).where(eq(crewMembers.crewId, invite.crewId));
    if (members.length >= MAX_CREW_SIZE) return { error: "This crew is already full." } as const;
    await tx.insert(crewMembers).values({ crewId: invite.crewId, userId: user.id }).onConflictDoNothing();
    await tx.update(crewInvites).set({ status: "ACCEPTED" }).where(and(eq(crewInvites.id, inviteId), eq(crewInvites.status, "PENDING")));
    await tx.update(buildPoolListings).set({ status: "PAUSED", updatedAt: new Date() }).where(eq(buildPoolListings.userId, user.id));
    return { invite } as const;
  });

  if ("error" in outcome) return outcome;
  if (decision === "ACCEPTED") {
    await logEvent("contact_revealed", user.id, { crewId: outcome.invite.crewId });
    await createNotification(outcome.invite.inviterId, "CREW_INVITE_ACCEPTED", "Crew invitation accepted! 🎉", undefined, `/crews/${outcome.invite.crewId}`, {
      actorId: user.id,
      entityType: "crew",
      entityId: outcome.invite.crewId,
      emailPreference: "emailCrew",
      titleEn: "Your team invitation was accepted! 🎉",
    });
  }
  revalidatePath(`/crews/${outcome.invite.crewId}`);
  return { success: true };
}
