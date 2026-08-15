import "server-only";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  analyticsEvents,
  answers,
  applications,
  crews,
  profiles,
  projectMembers,
  projectRoles,
  profileAvatars,
  projects,
  questions,
  reports,
  users,
} from "@/db/schema";

export async function getAdminOverview() {
  const [
    userCount,
    suspendedCount,
    projectCount,
    crewCount,
    applicationCount,
    questionCount,
    answerCount,
    openReportCount,
    pendingAvatarCount,
    eventCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.isSuspended, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(projects).where(eq(projects.entryType, "PROJECT")),
    db.select({ count: sql<number>`count(*)::int` }).from(crews),
    db.select({ count: sql<number>`count(*)::int` }).from(applications),
    db.select({ count: sql<number>`count(*)::int` }).from(questions),
    db.select({ count: sql<number>`count(*)::int` }).from(answers),
    db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open")),
    db.select({ count: sql<number>`count(*)::int` }).from(profileAvatars).where(eq(profileAvatars.status, "PENDING")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} >= now() - interval '7 days'`),
  ]);

  const [recentReports, recentUsers, recentEvents] = await Promise.all([
    listAdminReports(5),
    listAdminUsers(undefined, 5),
    listAdminActivity(8),
  ]);

  return {
    users: userCount[0]?.count ?? 0,
    suspendedUsers: suspendedCount[0]?.count ?? 0,
    projects: projectCount[0]?.count ?? 0,
    crews: crewCount[0]?.count ?? 0,
    applications: applicationCount[0]?.count ?? 0,
    questions: questionCount[0]?.count ?? 0,
    answers: answerCount[0]?.count ?? 0,
    openReports: openReportCount[0]?.count ?? 0,
    pendingAvatars: pendingAvatarCount[0]?.count ?? 0,
    events7d: eventCount[0]?.count ?? 0,
    recentReports,
    recentUsers,
    recentEvents,
  };
}

export async function listAdminUsers(search?: string, limit = 100) {
  const condition = search?.trim()
    ? or(ilike(users.email, `%${search.trim()}%`), ilike(profiles.username, `%${search.trim()}%`))
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      systemRole: users.systemRole,
      emailVerifiedAt: users.emailVerifiedAt,
      isSuspended: users.isSuspended,
      suspendedAt: users.suspendedAt,
      suspendedReason: users.suspendedReason,
      createdAt: users.createdAt,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
      role: profiles.role,
      level: profiles.level,
      onboardingCompleted: profiles.onboardingCompleted,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(condition)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [owned, memberships, appCounts, reportCounts] = await Promise.all([
    db
      .select({ userId: projects.ownerId, count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(inArray(projects.ownerId, ids), eq(projects.entryType, "PROJECT")))
      .groupBy(projects.ownerId),
    db
      .select({ userId: projectMembers.userId, count: sql<number>`count(*)::int` })
      .from(projectMembers)
      .where(inArray(projectMembers.userId, ids))
      .groupBy(projectMembers.userId),
    db
      .select({ userId: applications.applicantId, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(inArray(applications.applicantId, ids))
      .groupBy(applications.applicantId),
    db
      .select({ userId: reports.reportedId, count: sql<number>`count(*)::int` })
      .from(reports)
      .where(inArray(reports.reportedId, ids))
      .groupBy(reports.reportedId),
  ]);

  const ownedMap = new Map(owned.map((r) => [r.userId, r.count]));
  const memberMap = new Map(memberships.map((r) => [r.userId, r.count]));
  const appMap = new Map(appCounts.map((r) => [r.userId, r.count]));
  const reportMap = new Map(reportCounts.map((r) => [r.userId, r.count]));

  return rows.map((row) => ({
    ...row,
    ownedProjects: ownedMap.get(row.id) ?? 0,
    projectMemberships: memberMap.get(row.id) ?? 0,
    applications: appMap.get(row.id) ?? 0,
    reportsReceived: reportMap.get(row.id) ?? 0,
  }));
}

export async function listAdminProjects(limit = 100) {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      tagline: projects.tagline,
      stage: projects.stage,
      commitment: projects.commitment,
      character: projects.character,
      createdAt: projects.createdAt,
      ownerId: projects.ownerId,
      ownerUsername: profiles.username,
      ownerAvatar: profiles.avatarEmoji,
      ownerSuspended: users.isSuspended,
    })
    .from(projects)
    .leftJoin(profiles, eq(profiles.userId, projects.ownerId))
    .leftJoin(users, eq(users.id, projects.ownerId))
    .where(eq(projects.entryType, "PROJECT"))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [roles, members, appCounts] = await Promise.all([
    db
      .select({ projectId: projectRoles.projectId, count: sql<number>`count(*)::int` })
      .from(projectRoles)
      .where(inArray(projectRoles.projectId, ids))
      .groupBy(projectRoles.projectId),
    db
      .select({ projectId: projectMembers.projectId, count: sql<number>`count(*)::int` })
      .from(projectMembers)
      .where(inArray(projectMembers.projectId, ids))
      .groupBy(projectMembers.projectId),
    db
      .select({ projectId: applications.projectId, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(inArray(applications.projectId, ids))
      .groupBy(applications.projectId),
  ]);
  const roleMap = new Map(roles.map((r) => [r.projectId, r.count]));
  const memberMap = new Map(members.map((r) => [r.projectId, r.count]));
  const appMap = new Map(appCounts.map((r) => [r.projectId, r.count]));
  return rows.map((row) => ({
    ...row,
    openRoleDefinitions: roleMap.get(row.id) ?? 0,
    memberCount: memberMap.get(row.id) ?? 0,
    applicationCount: appMap.get(row.id) ?? 0,
  }));
}

export async function listAdminReports(limit = 100) {
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit);
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.reporterId, r.reportedId])));
  const people = await db
    .select({ id: users.id, email: users.email, username: profiles.username, avatarEmoji: profiles.avatarEmoji, isSuspended: users.isSuspended })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(inArray(users.id, ids));
  const peopleMap = new Map(people.map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    reporter: peopleMap.get(row.reporterId) ?? null,
    reported: peopleMap.get(row.reportedId) ?? null,
  }));
}

export async function listAdminQuestions(limit = 100) {
  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      description: questions.description,
      createdAt: questions.createdAt,
      authorId: questions.authorId,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
      email: users.email,
      answerCount: sql<number>`count(${answers.id})::int`,
      helpfulCount: sql<number>`count(${answers.id}) filter (where ${answers.isHelpful} = true)::int`,
    })
    .from(questions)
    .leftJoin(profiles, eq(profiles.userId, questions.authorId))
    .leftJoin(users, eq(users.id, questions.authorId))
    .leftJoin(answers, eq(answers.questionId, questions.id))
    .groupBy(questions.id, profiles.username, profiles.avatarEmoji, users.email)
    .orderBy(desc(questions.createdAt))
    .limit(limit);
  return rows;
}

export async function listAdminActivity(limit = 100) {
  const auditRows = await db
    .select({
      id: adminAuditLogs.id,
      kind: sql<string>`'admin'`,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      details: adminAuditLogs.details,
      createdAt: adminAuditLogs.createdAt,
      adminEmail: users.email,
    })
    .from(adminAuditLogs)
    .leftJoin(users, eq(users.id, adminAuditLogs.adminId))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
  return auditRows;
}

export async function getAdminAnalytics() {
  const rows = await db
    .select({ eventType: analyticsEvents.eventType, count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.eventType)
    .orderBy(sql`count(*) desc`);
  return rows;
}
