import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { isUuid } from "@/lib/security";
import {
  blocks,
  profiles,
  projectMembers,
  projectRoles,
  projectTechnologies,
  projects,
  users,
  type Commitment,
  type Level,
  type RoleType,
  type Stage,
} from "@/db/schema";

export type ProjectFilters = {
  role?: RoleType;
  technology?: string;
  level?: Level;
  interest?: string;
  commitment?: Commitment;
  stage?: Stage;
  search?: string;
};

async function attachRelations(projectRows: (typeof projects.$inferSelect)[]) {
  const ids = projectRows.map((p) => p.id);
  if (ids.length === 0) return [];

  const [techRows, roleRows, memberRows, ownerRows] = await Promise.all([
    db.select().from(projectTechnologies).where(inArray(projectTechnologies.projectId, ids)),
    db.select().from(projectRoles).where(inArray(projectRoles.projectId, ids)),
    db.select().from(projectMembers).where(inArray(projectMembers.projectId, ids)),
    db
      .select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji, isSuspended: users.isSuspended })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId)),
  ]);

  const ownerMap = new Map(ownerRows.map((o) => [o.userId, o]));

  return projectRows.map((project) => {
    const technologies = techRows.filter((t) => t.projectId === project.id).map((t) => t.name);
    const roles = roleRows.filter((r) => r.projectId === project.id);
    const members = memberRows.filter((m) => m.projectId === project.id);
    const filledByRole = new Map<string, number>();
    for (const m of members) {
      if (m.roleId) filledByRole.set(m.roleId, (filledByRole.get(m.roleId) ?? 0) + 1);
    }
    const rolesWithAvailability = roles.map((r) => ({
      ...r,
      filled: filledByRole.get(r.id) ?? 0,
      open: Math.max(0, r.slots - (filledByRole.get(r.id) ?? 0)),
    }));
    return {
      ...project,
      technologies,
      roles: rolesWithAvailability,
      openRoles: rolesWithAvailability.filter((r) => r.open > 0),
      members: members.map((m) => ({ ...m, profile: ownerMap.get(m.userId) ?? null })),
      owner: ownerMap.get(project.ownerId) ?? null,
    };
  });
}

export async function listProjects(filters: ProjectFilters = {}, viewerId?: string) {
  const conditions = [] as ReturnType<typeof eq>[];
  if (filters.stage) conditions.push(eq(projects.stage, filters.stage));
  if (filters.commitment) conditions.push(eq(projects.commitment, filters.commitment));
  if (filters.search) {
    conditions.push(sql`(${projects.name} ilike ${"%" + filters.search + "%"} or ${projects.tagline} ilike ${"%" + filters.search + "%"})` as unknown as ReturnType<typeof eq>);
  }
  if (filters.interest) {
    conditions.push(sql`${filters.interest} = any(${projects.interests})` as unknown as ReturnType<typeof eq>);
  }

  const rows = await db
    .select()
    .from(projects)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt));

  let withRelations = (await attachRelations(rows)).filter((p) => !p.owner?.isSuspended);

  if (viewerId) {
    const blockRows = await db.select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId }).from(blocks)
      .where(sql`${blocks.blockerId} = ${viewerId} or ${blocks.blockedId} = ${viewerId}`);
    const blockedIds = new Set(blockRows.map((b) => b.blockerId === viewerId ? b.blockedId : b.blockerId));
    withRelations = withRelations.filter((p) => !blockedIds.has(p.ownerId));
  }

  if (filters.role) {
    withRelations = withRelations.filter((p) => p.roles.some((r) => r.roleType === filters.role));
  }
  if (filters.technology) {
    withRelations = withRelations.filter((p) => p.technologies.includes(filters.technology!));
  }
  if (filters.level) {
    withRelations = withRelations.filter((p) => p.roles.some((r) => r.preferredLevel === filters.level));
  }

  return withRelations;
}

export async function getProjectById(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!rows[0]) return null;
  const [withRelations] = await attachRelations(rows);
  if (!withRelations || withRelations.owner?.isSuspended) return null;

  const memberIds = withRelations.members.map((m) => m.userId);
  const memberProfiles = memberIds.length
    ? await db
        .select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji, role: profiles.role })
        .from(profiles)
        .where(inArray(profiles.userId, memberIds))
    : [];
  const profileMap = new Map(memberProfiles.map((p) => [p.userId, p]));

  return {
    ...withRelations,
    members: withRelations.members.map((m) => ({
      ...m,
      profile: profileMap.get(m.userId) ?? null,
    })),
  };
}

export async function listProjectsForOwner(ownerId: string) {
  const rows = await db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.createdAt));
  return attachRelations(rows);
}

export async function listProjectsForMember(userId: string) {
  const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.userId, userId));
  const ids = memberRows.map((m) => m.projectId);
  if (ids.length === 0) return [];
  const rows = await db.select().from(projects).where(inArray(projects.id, ids)).orderBy(desc(projects.createdAt));
  return attachRelations(rows);
}
