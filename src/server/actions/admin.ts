"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  answers,
  projects,
  questions,
  reports,
  sessions,
  users,
} from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { uuidSchema } from "@/lib/validations";

async function requireAdmin() {
  const user = await getVerifiedCurrentUser();
  if (!user || !isAdmin(user.email, user.systemRole)) throw new Error("Administrator permission required.");
  return user;
}

async function audit(adminId: string, action: string, targetType: string, targetId: string | null, details?: Record<string, unknown>) {
  await db.insert(adminAuditLogs).values({
    adminId,
    action,
    targetType,
    targetId,
    details: details ?? null,
  });
}

export async function setUserSuspensionAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!uuidSchema.safeParse(userId).success || !["suspend", "restore"].includes(mode)) return;
  if (userId === admin.id) throw new Error("You cannot suspend your own administrator account.");

  const target = await db.select({ email: users.email, systemRole: users.systemRole, isSuspended: users.isSuspended }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target[0]) return;
  if (isAdmin(target[0].email, target[0].systemRole)) throw new Error("You cannot suspend another administrator from this panel.");

  if (mode === "suspend") {
    await db
      .update(users)
      .set({ isSuspended: true, suspendedAt: new Date(), suspendedReason: reason || "Zawieszone przez administratora" })
      .where(eq(users.id, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await audit(admin.id, "USER_SUSPENDED", "user", userId, { email: target[0].email, reason: reason || null });
  } else {
    await db
      .update(users)
      .set({ isSuspended: false, suspendedAt: null, suspendedReason: null })
      .where(eq(users.id, userId));
    await audit(admin.id, "USER_RESTORED", "user", userId, { email: target[0].email });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/builders");
  revalidatePath("/build");
  revalidatePath("/projects");
}

export async function updateReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!uuidSchema.safeParse(reportId).success || !["open", "in_review", "resolved", "dismissed"].includes(status)) return;

  await db
    .update(reports)
    .set({
      status,
      adminNote: note || null,
      reviewedAt: status === "open" ? null : new Date(),
      reviewedBy: status === "open" ? null : admin.id,
    })
    .where(eq(reports.id, reportId));
  await audit(admin.id, "REPORT_UPDATED", "report", reportId, { status, note: note || null });

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
}

export async function deleteProjectAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  if (!uuidSchema.safeParse(projectId).success) return;
  const target = await db.select({ name: projects.name, ownerId: projects.ownerId }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!target[0]) return;

  await db.delete(projects).where(eq(projects.id, projectId));
  await audit(admin.id, "PROJECT_DELETED", "project", projectId, target[0]);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

export async function deleteQuestionAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  if (!uuidSchema.safeParse(questionId).success) return;
  const target = await db.select({ title: questions.title, authorId: questions.authorId }).from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!target[0]) return;

  await db.delete(questions).where(eq(questions.id, questionId));
  await audit(admin.id, "QUESTION_DELETED", "question", questionId, target[0]);
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/help");
}

export async function deleteAnswerAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const answerId = String(formData.get("answerId") ?? "");
  if (!uuidSchema.safeParse(answerId).success) return;
  const target = await db.select({ questionId: answers.questionId, authorId: answers.authorId }).from(answers).where(eq(answers.id, answerId)).limit(1);
  if (!target[0]) return;
  await db.delete(answers).where(eq(answers.id, answerId));
  await audit(admin.id, "ANSWER_DELETED", "answer", answerId, target[0]);
  revalidatePath("/admin/content");
  revalidatePath(`/help/${target[0].questionId}`);
}
