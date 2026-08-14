import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, notifications, users, type NotificationType } from "@/db/schema";
import { buildCrewEmail, escapeEmailHtml, sendTransactionalEmail } from "@/lib/email";

type EmailPreferenceKey =
  | "emailProjectApplications"
  | "emailProjectAccepted"
  | "emailBuildPool"
  | "emailCrew"
  | "emailChallenge"
  | "emailShowcaseFeedback"
  | "emailMessages"
  | "emailMatches"
  | "emailWeeklyDigest";

export type NotificationOptions = {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  emailPreference?: EmailPreferenceKey;
  emailCtaLabel?: string;
};

const DEFAULT_EMAIL_PREFERENCES: Record<EmailPreferenceKey, boolean> = {
  emailProjectApplications: true,
  emailProjectAccepted: true,
  emailBuildPool: true,
  emailCrew: true,
  emailChallenge: true,
  emailShowcaseFeedback: false,
  emailMessages: true,
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
    db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1),
  ]);

  const preference = prefs[0]?.[options.emailPreference] ?? DEFAULT_EMAIL_PREFERENCES[options.emailPreference];
  if (!preference || !recipient[0]?.email) return created;

  const result = await sendTransactionalEmail({
    to: recipient[0].email,
    subject: title,
    html: buildCrewEmail({
      eyebrow: "Nowe na BuildCrew",
      title,
      intro: body,
      content: body ? undefined : `<p style="font-size:14px;line-height:1.6;color:#66665f;margin:0">${escapeEmailHtml(title)}</p>`,
      ctaLabel: options.emailCtaLabel ?? "Otwórz w BuildCrew",
      ctaHref: link ?? "/dashboard",
    }),
    devPreview: `${title}${body ? ` — ${body}` : ""}\n${link ?? "/dashboard"}`,
  });

  if (result.ok) {
    await db.update(notifications).set({ emailSentAt: new Date() }).where(eq(notifications.id, created.id));
  }
  return created;
}
