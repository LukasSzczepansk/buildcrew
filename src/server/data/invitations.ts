import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { buildProposals, crewInvites, profiles, projectInvites, projects } from "@/db/schema";

export async function listPendingInvitations(userId: string) {
  const [proposalRows, crewRows, projectRows] = await Promise.all([
    db
      .select({
        id: buildProposals.id,
        message: buildProposals.message,
        createdAt: buildProposals.createdAt,
        senderId: buildProposals.senderId,
        senderUsername: profiles.username,
        senderAvatar: profiles.avatarEmoji,
        senderRole: profiles.role,
      })
      .from(buildProposals)
      .innerJoin(profiles, eq(profiles.userId, buildProposals.senderId))
      .where(and(eq(buildProposals.receiverId, userId), eq(buildProposals.status, "PENDING")))
      .orderBy(desc(buildProposals.createdAt)),
    db
      .select({
        id: crewInvites.id,
        crewId: crewInvites.crewId,
        message: crewInvites.message,
        createdAt: crewInvites.createdAt,
        inviterId: crewInvites.inviterId,
        inviterUsername: profiles.username,
        inviterAvatar: profiles.avatarEmoji,
      })
      .from(crewInvites)
      .innerJoin(profiles, eq(profiles.userId, crewInvites.inviterId))
      .where(and(eq(crewInvites.inviteeId, userId), eq(crewInvites.status, "PENDING")))
      .orderBy(desc(crewInvites.createdAt)),
    db
      .select({
        id: projectInvites.id,
        projectId: projectInvites.projectId,
        projectName: projects.name,
        projectTagline: projects.tagline,
        message: projectInvites.message,
        createdAt: projectInvites.createdAt,
        inviterId: projectInvites.inviterId,
        inviterUsername: profiles.username,
        inviterAvatar: profiles.avatarEmoji,
      })
      .from(projectInvites)
      .innerJoin(projects, eq(projects.id, projectInvites.projectId))
      .innerJoin(profiles, eq(profiles.userId, projectInvites.inviterId))
      .where(and(eq(projectInvites.inviteeId, userId), eq(projectInvites.status, "PENDING")))
      .orderBy(desc(projectInvites.createdAt)),
  ]);

  return {
    buildProposals: proposalRows,
    crewInvites: crewRows,
    projectInvites: projectRows,
    count: proposalRows.length + crewRows.length + projectRows.length,
  };
}
