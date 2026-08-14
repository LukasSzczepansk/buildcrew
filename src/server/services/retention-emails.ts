import "server-only";

import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  analyticsEvents,
  notificationPreferences,
  users,
  type Commitment,
  type Goal,
  type Level,
  type RoleType,
} from "@/db/schema";
import { logEvent } from "@/lib/analytics";
import { absoluteUrl, buildCrewEmail, escapeEmailHtml, sendTransactionalEmail } from "@/lib/email";
import { computeMatch } from "@/lib/matching";
import { unreadMessagesCount } from "@/server/data/messages";
import { listBuilderProfiles } from "@/server/data/profiles";
import { listProjects } from "@/server/data/projects";

const MATCH_COOLDOWN_MS = 72 * 60 * 60 * 1000;
const WEEKLY_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_SKIP_MS = 6 * 60 * 60 * 1000;

type Builder = Awaited<ReturnType<typeof listBuilderProfiles>>[number];
type Project = Awaited<ReturnType<typeof listProjects>>[number];

function projectMatch(profile: Builder, project: Project) {
  let score = 0;
  const reasons: string[] = [];

  if (profile.role && project.openRoles.some((role) => role.roleType === profile.role)) {
    score += 45;
    reasons.push("Projekt szuka Twojej roli");
  }

  const sharedTech = project.technologies.filter((technology) => profile.skills.includes(technology));
  if (sharedTech.length > 0) {
    score += Math.min(25, sharedTech.length * 10);
    reasons.push(`Wspólny stack: ${sharedTech.slice(0, 2).join(", ")}`);
  }

  const sharedInterests = project.interests.filter((interest) => profile.interests.includes(interest));
  if (sharedInterests.length > 0) {
    score += Math.min(20, sharedInterests.length * 10);
    reasons.push(`Obszar: ${sharedInterests.slice(0, 2).join(", ")}`);
  }

  if (profile.weeklyHours && project.commitment && profile.weeklyHours === project.commitment) {
    score += 15;
    reasons.push("Pasująca dostępność");
  }

  if (profile.level && project.openRoles.some((role) => role.preferredLevel === profile.level)) {
    score += 10;
    reasons.push("Pasujący poziom doświadczenia");
  }

  return { score: Math.min(100, score), reasons };
}

function builderMatch(profile: Builder, other: Builder) {
  return computeMatch(
    {
      userId: profile.userId,
      username: profile.username,
      role: profile.role as RoleType | null,
      level: profile.level as Level | null,
      weeklyHours: profile.weeklyHours as Commitment | null,
      interests: profile.interests,
      goals: profile.goals as Goal[],
    },
    {
      userId: other.userId,
      username: other.username,
      role: other.role as RoleType | null,
      level: other.level as Level | null,
      weeklyHours: other.weeklyHours as Commitment | null,
      interests: other.interests,
      goals: other.goals as Goal[],
    },
  );
}

function smallLink(label: string, href: string) {
  return `<a href="${absoluteUrl(href)}" style="color:#111111;text-decoration:none;font-weight:600">${escapeEmailHtml(label)} →</a>`;
}

function matchRows(builders: { builder: Builder; score: number; reasons: string[] }[], projects: { project: Project; score: number; reasons: string[] }[]) {
  const rows: string[] = [];

  for (const item of builders.slice(0, 3)) {
    rows.push(`
      <div style="padding:14px 0;border-top:1px solid #e4e4dd">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline">
          <div style="font-size:14px;font-weight:650">${escapeEmailHtml(item.builder.username)}</div>
          <div style="font-size:14px;font-weight:700;color:#86ad22">${item.score}% match</div>
        </div>
        <div style="margin-top:4px;font-size:12px;line-height:1.55;color:#777770">${escapeEmailHtml(item.reasons.slice(0, 2).join(" · ") || "Sprawdź profil i wspólne punkty.")}</div>
        <div style="margin-top:8px;font-size:12px">${smallLink("Zobacz profil", `/builders/${item.builder.userId}`)}</div>
      </div>`);
  }

  for (const item of projects.slice(0, 3)) {
    rows.push(`
      <div style="padding:14px 0;border-top:1px solid #e4e4dd">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline">
          <div style="font-size:14px;font-weight:650">${escapeEmailHtml(item.project.name)}</div>
          <div style="font-size:14px;font-weight:700;color:#86ad22">${item.score}% match</div>
        </div>
        <div style="margin-top:4px;font-size:12px;line-height:1.55;color:#777770">${escapeEmailHtml(item.reasons.slice(0, 2).join(" · ") || item.project.tagline)}</div>
        <div style="margin-top:8px;font-size:12px">${smallLink("Zobacz projekt", `/projects/${item.project.id}`)}</div>
      </div>`);
  }

  return rows.join("");
}

async function retentionData() {
  const [builders, projects, recipients] = await Promise.all([
    listBuilderProfiles(),
    listProjects(),
    db
      .select({
        id: users.id,
        email: users.email,
        lastActiveAt: users.lastActiveAt,
        emailMatches: notificationPreferences.emailMatches,
        emailWeeklyDigest: notificationPreferences.emailWeeklyDigest,
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(notificationPreferences.userId, users.id))
      .where(and(eq(users.isSuspended, false), isNotNull(users.emailVerifiedAt))),
  ]);

  const profileMap = new Map(builders.filter((builder) => builder.onboardingCompleted && !builder.isDemo).map((builder) => [builder.userId, builder]));
  return { builders: [...profileMap.values()], profileMap, projects, recipients: recipients.filter((recipient) => !recipient.email.toLowerCase().endsWith(".invalid")) };
}

export async function sendStrongMatchEmails() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - MATCH_COOLDOWN_MS);
  const [{ builders, profileMap, projects, recipients }, recent] = await Promise.all([
    retentionData(),
    db.select({ userId: analyticsEvents.userId }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "match_email_sent"), gte(analyticsEvents.createdAt, cutoff))),
  ]);
  const recentlySent = new Set(recent.map((event) => event.userId).filter((id): id is string => Boolean(id)));

  let sent = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const profile = profileMap.get(recipient.id);
    if (!profile || recipient.emailMatches === false || recentlySent.has(recipient.id)) {
      skipped += 1;
      continue;
    }
    if (recipient.lastActiveAt && now.getTime() - recipient.lastActiveAt.getTime() < RECENT_ACTIVITY_SKIP_MS) {
      skipped += 1;
      continue;
    }

    const builderMatches = builders
      .filter((builder) => builder.userId !== profile.userId)
      .map((builder) => ({ builder, ...builderMatch(profile, builder) }))
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const projectMatches = projects
      .filter((project) => project.ownerId !== profile.userId && project.openRoles.length > 0)
      .map((project) => ({ project, ...projectMatch(profile, project) }))
      .filter((item) => item.score >= 65)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const total = builderMatches.length + projectMatches.length;
    if (total === 0) {
      skipped += 1;
      continue;
    }

    const result = await sendTransactionalEmail({
      to: recipient.email,
      subject: total === 1 ? "Masz nowe dopasowanie na BuildCrew" : `${total} dopasowania warte sprawdzenia`,
      html: buildCrewEmail({
        eyebrow: "Dopasowania",
        title: total === 1 ? "Pojawiło się nowe dopasowanie" : `Masz ${total} dopasowania warte sprawdzenia`,
        intro: "Wysyłamy tylko mocniejsze dopasowania i nie częściej niż raz na kilka dni.",
        content: matchRows(builderMatches, projectMatches),
        ctaLabel: "Zobacz dopasowania",
        ctaHref: "/dashboard",
      }),
      devPreview: `${total} nowych dopasowań dla ${profile.username}`,
    });

    if (result.ok) {
      sent += 1;
      await logEvent("match_email_sent", recipient.id, { builderMatches: builderMatches.length, projectMatches: projectMatches.length });
    }
  }

  return { sent, skipped, recipients: recipients.length };
}

export async function sendWeeklyDigests() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - WEEKLY_COOLDOWN_MS);
  const [{ builders, profileMap, projects, recipients }, recent] = await Promise.all([
    retentionData(),
    db.select({ userId: analyticsEvents.userId }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "weekly_digest_sent"), gte(analyticsEvents.createdAt, cutoff))),
  ]);
  const recentlySent = new Set(recent.map((event) => event.userId).filter((id): id is string => Boolean(id)));

  let sent = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const profile = profileMap.get(recipient.id);
    if (!profile || recipient.emailWeeklyDigest === false || recentlySent.has(recipient.id)) {
      skipped += 1;
      continue;
    }

    const builderMatches = builders
      .filter((builder) => builder.userId !== profile.userId)
      .map((builder) => ({ builder, ...builderMatch(profile, builder) }))
      .filter((item) => item.score >= 55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const projectMatches = projects
      .filter((project) => project.ownerId !== profile.userId && project.openRoles.length > 0)
      .map((project) => ({ project, ...projectMatch(profile, project) }))
      .filter((item) => item.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const unread = await unreadMessagesCount(recipient.id);
    if (builderMatches.length === 0 && projectMatches.length === 0 && unread === 0) {
      skipped += 1;
      continue;
    }

    const summary = [
      builderMatches.length ? `${builderMatches.length} ${builderMatches.length === 1 ? "osoba" : "osoby"}` : null,
      projectMatches.length ? `${projectMatches.length} ${projectMatches.length === 1 ? "projekt" : "projekty"}` : null,
      unread ? `${unread} ${unread === 1 ? "nieprzeczytana wiadomość" : "nieprzeczytane wiadomości"}` : null,
    ].filter(Boolean).join(" · ");

    const unreadBlock = unread > 0 ? `
      <div style="margin:0 0 18px;padding:12px 14px;background:#f3f8df;border-left:3px solid #c8f169;font-size:13px;line-height:1.55">
        Masz <strong>${unread}</strong> ${unread === 1 ? "nieprzeczytaną wiadomość" : "nieprzeczytane wiadomości"}. ${smallLink("Otwórz wiadomości", "/messages")}
      </div>` : "";

    const result = await sendTransactionalEmail({
      to: recipient.email,
      subject: `Twój tydzień na BuildCrew: ${summary}`,
      html: buildCrewEmail({
        eyebrow: "Tygodniowe podsumowanie",
        title: `Co warto sprawdzić, ${profile.username}`,
        intro: "Krótko: tylko rzeczy, które mogą prowadzić do rozmowy albo projektu.",
        content: `${unreadBlock}${matchRows(builderMatches, projectMatches)}`,
        ctaLabel: "Otwórz BuildCrew",
        ctaHref: "/dashboard",
      }),
      devPreview: summary,
    });

    if (result.ok) {
      sent += 1;
      await logEvent("weekly_digest_sent", recipient.id, { builderMatches: builderMatches.length, projectMatches: projectMatches.length, unread });
    }
  }

  return { sent, skipped, recipients: recipients.length };
}
