import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, notifications, users, type NotificationType } from "@/db/schema";
import { absoluteUrl, sendTransactionalEmail } from "@/lib/email";

type EmailPreferenceKey =
  | "emailProjectApplications"
  | "emailProjectAccepted"
  | "emailBuildPool"
  | "emailCrew"
  | "emailChallenge"
  | "emailShowcaseFeedback"
  | "emailMessages";

export type NotificationOptions = {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  emailPreference?: EmailPreferenceKey;
};

const DEFAULT_EMAIL_PREFERENCES: Record<EmailPreferenceKey, boolean> = {
  emailProjectApplications: true,
  emailProjectAccepted: true,
  emailBuildPool: true,
  emailCrew: true,
  emailChallenge: true,
  emailShowcaseFeedback: false,
  emailMessages: false,
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

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

  const target = link ? absoluteUrl(link) : absoluteUrl("/dashboard");
  const result = await sendTransactionalEmail({
    to: recipient[0].email,
    subject: title,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#171717">
        <h2 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h2>
        ${body ? `<p style="line-height:1.6;color:#525252">${escapeHtml(body)}</p>` : ""}
        <p style="margin-top:24px"><a href="${target}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:600">Otwórz w BuildCrew</a></p>
        <p style="margin-top:28px;font-size:12px;color:#a3a3a3">Ustawienia tych wiadomości możesz zmienić w Profil → Powiadomienia.</p>
      </div>`,
    devPreview: `${title}${body ? ` — ${body}` : ""}\n${target}`,
  });

  if (result.ok) {
    await db.update(notifications).set({ emailSentAt: new Date() }).where(eq(notifications.id, created.id));
  }
  return created;
}
