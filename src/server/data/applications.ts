import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, profiles, projectRoles } from "@/db/schema";

export async function listApplicationsForProject(projectId: string) {
  const rows = await db
    .select({ application: applications, role: projectRoles, applicant: profiles })
    .from(applications)
    .innerJoin(projectRoles, eq(projectRoles.id, applications.roleId))
    .innerJoin(profiles, eq(profiles.userId, applications.applicantId))
    .where(eq(applications.projectId, projectId))
    .orderBy(desc(applications.createdAt));

  return rows.map((r) => ({ ...r.application, role: r.role, applicant: r.applicant }));
}
