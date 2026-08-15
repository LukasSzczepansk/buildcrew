import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, notifications, users, type NotificationType } from "@/db/schema";
import { buildCrewEmail, cancelScheduledEmail, escapeEmailHtml, sendTransactionalEmail } from "@/lib/email";

type EmailPreferenceKey =
  | "emailProjectApplications"
  | "emailProjectAccepted"
  | "emailBuildPool"
  | "emailCrew"
  | "emailChallenge"
  | "emailShowcaseFeedback"
  | "emailMessages"
  | "emailWorkspace"
  | "emailMatches"
  | "emailWeeklyDigest";

export type NotificationOptions = {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  emailPreference?: EmailPreferenceKey;
  emailCtaLabel?: string;
  /**
   * Delay a transactional email without a cron job. Resend keeps the message
   * scheduled; BuildCrew cancels it if the notification is read first.
   */
  emailDelayMinutes?: number;
  /** Separate copy for email so private message previews do not need to leave BuildCrew. */
  emailTitle?: string;
  emailIntro?: string | null;
};

const DEFAULT_EMAIL_PREFERENCES: Record<EmailPreferenceKey, boolean> = {
  emailProjectApplications: true,
  emailProjectAccepted: true,
  emailBuildPool: true,
  emailCrew: true,
  emailChallenge: true,
  emailShowcaseFeedback: false,
  emailMessages: true,
  emailWorkspace: true,
  emailMatches: true,
  emailWeeklyDigest: true,
};

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
  options: NotificationOptions = {},
) {
  const [created] = await db.insert(notifications).values({
    userId,
    actorId: options.actorId ?? null,
    type,
    entityType: options.entityType ?? null,
    entityId: options.entityId ?? null,
    title,
    body: body ?? null,
    link: link ?? null,
  }).returning({ id: notifications.id });

  if (!created || !options.emailPreference) return created;

  const [recipient, prefs] = await Promise.all([
    db.select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt, isSuspended: users.isSuspended })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1),
  ]);

  const preference = prefs[0]?.[options.emailPreference] ?? DEFAULT_EMAIL_PREFERENCES[options.emailPreference];
  const target = recipient[0];
  if (!preference || !target?.email || !target.emailVerifiedAt || target.isSuspended) return created;

  const delayMinutes = Math.max(0, Math.min(options.emailDelayMinutes ?? 0, 30 * 24 * 60));
  const scheduledFor = delayMinutes > 0 ? new Date(Date.now() + delayMinutes * 60 * 1000) : null;
  const emailTitle = options.emailTitle ?? title;
  const emailIntro = options.emailIntro === undefined ? body : options.emailIntro;

  const result = await sendTransactionalEmail({
    to: target.email,
    subject: emailTitle,
    html: buildCrewEmail({
      eyebrow: delayMinutes > 0 ? "Nieprzeczytane na BuildCrew" : "Nowe na BuildCrew",
      title: emailTitle,
      intro: emailIntro ?? undefined,
      content: emailIntro ? undefined : `<p style="font-size:14px;line-height:1.6;color:#66665f;margin:0">${escapeEmailHtml(emailTitle)}</p>`,
      ctaLabel: options.emailCtaLabel ?? "Otwórz w BuildCrew",
      ctaHref: link ?? "/dashboard",
    }),
    scheduledAt: scheduledFor?.toISOString(),
    idempotencyKey: `notification-${created.id}`,
    devPreview: `${emailTitle}${emailIntro ? ` — ${emailIntro}` : ""}\n${link ?? "/dashboard"}`,
  });

  if (result.ok) {
    await db.update(notifications).set(
      scheduledFor
        ? {
            emailProviderId: result.id,
            emailScheduledFor: scheduledFor,
          }
        : {
            emailProviderId: result.id,
            emailSentAt: new Date(),
          },
    ).where(eq(notifications.id, created.id));
  }
  return created;
}

async function cancelPendingEmail(row: {
  id: string;
  emailProviderId: string | null;
  emailScheduledFor: Date | null;
  emailCanceledAt: Date | null;
  emailSentAt: Date | null;
}) {
  if (!row.emailProviderId || !row.emailScheduledFor || row.emailCanceledAt || row.emailSentAt) return;
  if (row.emailScheduledFor.getTime() <= Date.now()) return;

  const result = await cancelScheduledEmail(row.emailProviderId);
  if (result.ok) {
    await db.update(notifications).set({ emailCanceledAt: new Date() }).where(eq(notifications.id, row.id));
  }
}

export async function markNotificationReadAndCancel(userId: string, notificationId: string) {
  const rows = await db.select({
    id: notifications.id,
    emailProviderId: notifications.emailProviderId,
    emailScheduledFor: notifications.emailScheduledFor,
    emailCanceledAt: notifications.emailCanceledAt,
    emailSentAt: notifications.emailSentAt,
  }).from(notifications).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).limit(1);

  if (!rows[0]) return;
  await cancelPendingEmail(rows[0]);
  await db.update(notifications).set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsReadAndCancel(userId: string) {
  const rows = await db.select({
    id: notifications.id,
    emailProviderId: notifications.emailProviderId,
    emailScheduledFor: notifications.emailScheduledFor,
    emailCanceledAt: notifications.emailCanceledAt,
    emailSentAt: notifications.emailSentAt,
  }).from(notifications).where(and(
    eq(notifications.userId, userId),
    eq(notifications.isRead, false),
    isNotNull(notifications.emailProviderId),
  ));

  await Promise.all(rows.map(cancelPendingEmail));
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, userId));
}

export async function markEntityNotificationsReadAndCancel(userId: string, entityType: string, entityId: string) {
  const rows = await db.select({
    id: notifications.id,
    emailProviderId: notifications.emailProviderId,
    emailScheduledFor: notifications.emailScheduledFor,
    emailCanceledAt: notifications.emailCanceledAt,
    emailSentAt: notifications.emailSentAt,
  }).from(notifications).where(and(
    eq(notifications.userId, userId),
    eq(notifications.entityType, entityType),
    eq(notifications.entityId, entityId),
    eq(notifications.isRead, false),
  ));

  await Promise.all(rows.map(cancelPendingEmail));
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(and(
    eq(notifications.userId, userId),
    eq(notifications.entityType, entityType),
    eq(notifications.entityId, entityId),
    eq(notifications.isRead, false),
  ));
}

export async function cancelPendingNotificationEmailsByType(userId: string, type: NotificationType) {
  const rows = await db.select({
    id: notifications.id,
    emailProviderId: notifications.emailProviderId,
    emailScheduledFor: notifications.emailScheduledFor,
    emailCanceledAt: notifications.emailCanceledAt,
    emailSentAt: notifications.emailSentAt,
  }).from(notifications).where(and(
    eq(notifications.userId, userId),
    eq(notifications.type, type),
    isNotNull(notifications.emailProviderId),
  ));

  await Promise.all(rows.map(cancelPendingEmail));
}
