"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  answers,
  notificationPreferences,
  notifications,
  projects,
  questions,
  reports,
  sessions,
  users,
} from "@/db/schema";
import { getVerifiedCurrentUser, isAdmin } from "@/lib/auth";
import { sendTransactionalEmailBatch } from "@/lib/email";
import { buildPremieryAnnouncementEmail } from "@/lib/premiery-announcement-email";
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
      .set({ isSuspended: true, suspendedAt: new Date(), suspendedReason: reason || "Suspended by an administrator" })
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


const PREMIERY_ANNOUNCEMENT_ID = "premiery-launch-2026-08-22";
const PREMIERY_EMAIL_BATCH_SIZE = 100;

export async function broadcastPremieryAnnouncementAction() {
  const admin = await requireAdmin();

  const recipients = await db.select({
    id: users.id,
    email: users.email,
    emailVerifiedAt: users.emailVerifiedAt,
    preferredLocale: users.preferredLocale,
  })
    .from(users)
    .where(eq(users.isSuspended, false));

  const recipientIds = recipients.map((recipient) => recipient.id);
  const [alreadySent, preferenceRows] = await Promise.all([
    db.select({
      id: notifications.id,
      userId: notifications.userId,
      emailSentAt: notifications.emailSentAt,
    })
      .from(notifications)
      .where(and(
        eq(notifications.entityType, "system_announcement"),
        eq(notifications.entityId, PREMIERY_ANNOUNCEMENT_ID),
      )),
    recipientIds.length
      ? db.select({
          userId: notificationPreferences.userId,
          emailWeeklyDigest: notificationPreferences.emailWeeklyDigest,
        })
          .from(notificationPreferences)
          .where(inArray(notificationPreferences.userId, recipientIds))
      : Promise.resolve([]),
  ]);

  const notificationByUser = new Map(alreadySent.map((row) => [row.userId, row]));
  const pendingNotifications = recipients.filter((recipient) => !notificationByUser.has(recipient.id));

  const notificationValues = pendingNotifications.map((recipient) => ({
    userId: recipient.id,
    actorId: admin.id,
    type: "SYSTEM_ANNOUNCEMENT" as const,
    entityType: "system_announcement",
    entityId: PREMIERY_ANNOUNCEMENT_ID,
    title: recipient.preferredLocale === "en" ? "New in BuildCrew - Launches 🚀" : "Nowość w BuildCrew - Premiery 🚀",
    body: recipient.preferredLocale === "en"
      ? "Got a project, app, website, game, SaaS, or something you're still working on? You can now share it in Launches, collect feedback, find testers, first users, or people to keep building with. Your project does not have to be finished or created on BuildCrew. Show your project →"
      : "Masz projekt, aplikację, stronę, grę, SaaS albo coś, nad czym dopiero pracujesz? Od teraz możesz pokazać to w Premierach, zebrać feedback, znaleźć testerów, pierwszych użytkowników albo osoby do dalszej współpracy. Projekt nie musi być skończony ani stworzony na BuildCrew. Pokaż swój projekt →",
    link: "/launches/new",
  }));

  const NOTIFICATION_BATCH_SIZE = 400;
  for (let offset = 0; offset < notificationValues.length; offset += NOTIFICATION_BATCH_SIZE) {
    const created = await db.insert(notifications)
      .values(notificationValues.slice(offset, offset + NOTIFICATION_BATCH_SIZE))
      .returning({
        id: notifications.id,
        userId: notifications.userId,
        emailSentAt: notifications.emailSentAt,
      });
    for (const row of created) notificationByUser.set(row.userId, row);
  }

  const emailPreferenceByUser = new Map(preferenceRows.map((row) => [row.userId, row.emailWeeklyDigest]));
  const emailRecipients = recipients.filter((recipient) => {
    const announcement = notificationByUser.get(recipient.id);
    if (!announcement || announcement.emailSentAt) return false;
    if (!recipient.email || !recipient.emailVerifiedAt) return false;
    return emailPreferenceByUser.get(recipient.id) !== false;
  });

  let emailsSent = 0;
  let emailBatchFailures = 0;

  for (let offset = 0; offset < emailRecipients.length; offset += PREMIERY_EMAIL_BATCH_SIZE) {
    const batch = emailRecipients.slice(offset, offset + PREMIERY_EMAIL_BATCH_SIZE);
    const emailPayload = batch.map((recipient) => {
      const locale = recipient.preferredLocale === "en" ? "en" as const : "pl" as const;
      const email = buildPremieryAnnouncementEmail(locale);
      return {
        to: recipient.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      };
    });

    const result = await sendTransactionalEmailBatch({
      emails: emailPayload,
      idempotencyKey: `${PREMIERY_ANNOUNCEMENT_ID}-${offset}-${batch.map((recipient) => recipient.id).sort().join("-")}`.slice(0, 250),
    });

    if (!result.ok) {
      emailBatchFailures += 1;
      continue;
    }

    if (!result.dev) {
      const notificationIds = batch
        .map((recipient) => notificationByUser.get(recipient.id)?.id)
        .filter((id): id is string => Boolean(id));
      if (notificationIds.length) {
        await db.update(notifications)
          .set({ emailSentAt: new Date() })
          .where(inArray(notifications.id, notificationIds));
      }
      emailsSent += batch.length;
    }
  }

  const verifiedEmailCount = recipients.filter((recipient) => Boolean(recipient.email && recipient.emailVerifiedAt)).length;
  const optedOutCount = recipients.filter((recipient) => emailPreferenceByUser.get(recipient.id) === false).length;

  await audit(admin.id, "SYSTEM_ANNOUNCEMENT_SENT", "system_announcement", PREMIERY_ANNOUNCEMENT_ID, {
    recipients: recipients.length,
    inAppNewlySent: notificationValues.length,
    inAppSkippedAsDuplicate: alreadySent.length,
    verifiedEmailRecipients: verifiedEmailCount,
    emailEligible: emailRecipients.length,
    emailsSent,
    emailBatchFailures,
    emailOptedOut: optedOutCount,
    link: "/launches/new",
  });

  revalidatePath("/admin");
  revalidatePath("/notifications");
}
