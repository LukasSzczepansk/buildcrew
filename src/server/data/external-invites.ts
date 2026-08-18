import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { externalProjectInvites, profiles, projectRoles, projects } from "@/db/schema";
import { sha256 } from "@/lib/security";

export async function getExternalProjectInvite(rawToken: string) {
  const rows = await db.select({
    id: externalProjectInvites.id,
    email: externalProjectInvites.email,
    message: externalProjectInvites.message,
    expiresAt: externalProjectInvites.expiresAt,
    projectId: projects.id,
    projectName: projects.name,
    projectTagline: projects.tagline,
    inviterUsername: profiles.username,
    roleType: projectRoles.roleType,
  })
    .from(externalProjectInvites)
    .innerJoin(projects, eq(projects.id, externalProjectInvites.projectId))
    .innerJoin(profiles, eq(profiles.userId, externalProjectInvites.inviterId))
    .leftJoin(projectRoles, eq(projectRoles.id, externalProjectInvites.roleId))
    .where(and(eq(externalProjectInvites.tokenHash, sha256(rawToken)), eq(externalProjectInvites.status, "PENDING"), gt(externalProjectInvites.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}
