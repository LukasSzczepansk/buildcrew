import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { profiles, projectRoles, trialTaskAttempts, trialTasks, type TrialAttemptStatus } from "@/db/schema";
import { isUuid } from "@/lib/security";

/** Postgres "undefined_table": the trial-task migration has not been applied to this database yet. */
export function isMissingTrialTables(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current === "object" && (current as { code?: string }).code === "42P01") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Trial tasks are an optional feature. If the migration is not applied yet, every read returns the fallback
 * so existing pages (project page, applications, manage) keep working instead of crashing.
 */
async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isMissingTrialTables(error)) return fallback;
    throw error;
  }
}

export type TrialTaskSummary = {
  id: string;
  roleId: string;
  title: string;
  brief: string;
  timeLimitMinutes: number;
};

export type MyTrialAttempt = {
  id: string;
  trialTaskId: string;
  status: TrialAttemptStatus;
  startedAt: Date;
  dueAt: Date;
  submittedAt: Date | null;
  submissionUrl: string | null;
  submissionNote: string | null;
  addToPortfolio: boolean;
  reviewNote: string | null;
};

/** Active trial tasks of a project keyed by role id. Safe to show to any signed-in viewer. */
export async function listActiveTrialTasksForProject(projectId: string): Promise<TrialTaskSummary[]> {
  if (!isUuid(projectId)) return [];
  return safely(
    () => db
      .select({ id: trialTasks.id, roleId: trialTasks.roleId, title: trialTasks.title, brief: trialTasks.brief, timeLimitMinutes: trialTasks.timeLimitMinutes })
      .from(trialTasks)
      .where(and(eq(trialTasks.projectId, projectId), eq(trialTasks.isActive, true))),
    [],
  );
}

export async function listMyTrialAttempts(userId: string, taskIds: string[]): Promise<MyTrialAttempt[]> {
  if (!isUuid(userId) || taskIds.length === 0) return [];
  return safely(
    () => db
      .select({
        id: trialTaskAttempts.id,
        trialTaskId: trialTaskAttempts.trialTaskId,
        status: trialTaskAttempts.status,
        startedAt: trialTaskAttempts.startedAt,
        dueAt: trialTaskAttempts.dueAt,
        submittedAt: trialTaskAttempts.submittedAt,
        submissionUrl: trialTaskAttempts.submissionUrl,
        submissionNote: trialTaskAttempts.submissionNote,
        addToPortfolio: trialTaskAttempts.addToPortfolio,
        reviewNote: trialTaskAttempts.reviewNote,
      })
      .from(trialTaskAttempts)
      .where(and(eq(trialTaskAttempts.userId, userId), inArray(trialTaskAttempts.trialTaskId, taskIds))),
    [],
  );
}

export type OwnerTrialAttempt = MyTrialAttempt & {
  userId: string;
  username: string;
  roleId: string;
};

/** Owner view: every attempt on this project's trial tasks, newest submissions first. */
export async function listTrialAttemptsForProject(projectId: string): Promise<OwnerTrialAttempt[]> {
  if (!isUuid(projectId)) return [];
  return safely(
    () => db
      .select({
        id: trialTaskAttempts.id,
        trialTaskId: trialTaskAttempts.trialTaskId,
        status: trialTaskAttempts.status,
        startedAt: trialTaskAttempts.startedAt,
        dueAt: trialTaskAttempts.dueAt,
        submittedAt: trialTaskAttempts.submittedAt,
        submissionUrl: trialTaskAttempts.submissionUrl,
        submissionNote: trialTaskAttempts.submissionNote,
        addToPortfolio: trialTaskAttempts.addToPortfolio,
        reviewNote: trialTaskAttempts.reviewNote,
        userId: trialTaskAttempts.userId,
        username: profiles.username,
        roleId: trialTasks.roleId,
      })
      .from(trialTaskAttempts)
      .innerJoin(trialTasks, eq(trialTasks.id, trialTaskAttempts.trialTaskId))
      .innerJoin(profiles, eq(profiles.userId, trialTaskAttempts.userId))
      .where(eq(trialTasks.projectId, projectId))
      .orderBy(desc(trialTaskAttempts.submittedAt), desc(trialTaskAttempts.startedAt)),
    [],
  );
}

/** Roles of a project with their (optional) active trial task, for the owner's manage screen. */
export async function listRolesWithTrialTasks(projectId: string) {
  if (!isUuid(projectId)) return [];
  const roles = await db.select({ id: projectRoles.id, roleType: projectRoles.roleType, slots: projectRoles.slots }).from(projectRoles).where(eq(projectRoles.projectId, projectId)).orderBy(asc(projectRoles.createdAt));
  const tasks = await listActiveTrialTasksForProject(projectId);
  return roles.map((role) => ({ ...role, task: tasks.find((task) => task.roleId === role.id) ?? null }));
}

/** Best attempt status per applicant+role, used to badge applications ("trial passed"). Key: `${userId}:${roleId}`. */
export async function trialStatusByApplicant(projectId: string): Promise<Map<string, TrialAttemptStatus>> {
  const attempts = await listTrialAttemptsForProject(projectId);
  const rank: Record<TrialAttemptStatus, number> = { STARTED: 1, FAILED: 2, SUBMITTED: 3, PASSED: 4 };
  const map = new Map<string, TrialAttemptStatus>();
  for (const attempt of attempts) {
    const key = `${attempt.userId}:${attempt.roleId}`;
    const existing = map.get(key);
    if (!existing || rank[attempt.status] > rank[existing]) map.set(key, attempt.status);
  }
  return map;
}
