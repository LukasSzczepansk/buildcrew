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
import { siteUrlForLocale, type AppLocale } from "@/lib/site-config";
import { unreadMessagesCount } from "@/server/data/messages";
import { listBuilderProfiles } from "@/server/data/profiles";
import { listProjects } from "@/server/data/projects";

const MATCH_COOLDOWN_MS = 72 * 60 * 60 * 1000;
const WEEKLY_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_SKIP_MS = 6 * 60 * 60 * 1000;

type Builder = Awaited<ReturnType<typeof listBuilderProfiles>>[number];
type Project = Awaited<ReturnType<typeof listProjects>>[number];

function projectMatch(profile: Builder, project: Project, locale: AppLocale) {
  const en = locale === "en";
  let score = 0;
  const reasons: string[] = [];

  if (profile.role && project.openRoles.some((role) => role.roleType === profile.role)) {
    score += 45;
    reasons.push(en ? "The project is looking for your role" : "Projekt szuka Twojej roli");
  }

  const matchingRole = profile.role ? project.openRoles.find((role) => role.roleType === profile.role) : undefined;
  const targetSkills = matchingRole?.skills.length ? matchingRole.skills : project.technologies;
  const sharedTech = targetSkills.filter((technology) => profile.skills.includes(technology));
  if (sharedTech.length > 0) {
    score += Math.min(25, sharedTech.length * 10);
    reasons.push(`${en ? (matchingRole?.skills.length ? "Required skills" : "Shared stack") : (matchingRole?.skills.length ? "Required skills" : "Shared stack")}: ${sharedTech.slice(0, 2).join(", ")}`);
  }

  const sharedInterests = project.interests.filter((interest) => profile.interests.includes(interest));
  if (sharedInterests.length > 0) {
    score += Math.min(20, sharedInterests.length * 10);
    reasons.push(`${en ? "Area" : "Obszar"}: ${sharedInterests.slice(0, 2).join(", ")}`);
  }

  if (profile.weeklyHours && project.commitment && profile.weeklyHours === project.commitment) {
    score += 15;
    reasons.push(en ? "Matching availability" : "Matching availability");
  }

  if (profile.level && project.openRoles.some((role) => role.preferredLevel === profile.level)) {
    score += 10;
    reasons.push(en ? "Matching experience level" : "Matching experience level");
  }

  if (profile.languages?.length && project.projectLanguage) {
    const languageFits = project.projectLanguage === "MULTI" || profile.languages.includes(project.projectLanguage === "EN" ? "English" : "Polish");
    if (languageFits) {
      score += 10;
      reasons.push(en ? "You share a project language" : "Project language matches");
    }
  }

  return { score: Math.min(100, score), reasons };
}

function builderMatch(profile: Builder, other: Builder, locale: AppLocale) {
  return computeMatch(
    {
      userId: profile.userId,
      username: profile.username,
      role: profile.role as RoleType | null,
      level: profile.level as Level | null,
      weeklyHours: profile.weeklyHours as Commitment | null,
      interests: profile.interests,
      goals: profile.goals as Goal[],
      languages: profile.languages,
      workModePreference: profile.workModePreference,
      country: profile.country,
    },
    {
      userId: other.userId,
      username: other.username,
      role: other.role as RoleType | null,
      level: other.level as Level | null,
      weeklyHours: other.weeklyHours as Commitment | null,
      interests: other.interests,
      goals: other.goals as Goal[],
      languages: other.languages,
      workModePreference: other.workModePreference,
      country: other.country,
    },
    locale,
  );
}

function smallLink(label: string, href: string, baseUrl: string) {
  return `<a href="${absoluteUrl(href, baseUrl)}" style="color:#111111;text-decoration:none;font-weight:600">${escapeEmailHtml(label)} →</a>`;
}

function matchRows(
  builders: { builder: Builder; score: number; reasons: string[] }[],
  projects: { project: Project; score: number; reasons: string[] }[],
  locale: AppLocale,
) {
  const en = locale === "en";
  const baseUrl = siteUrlForLocale(locale);
  const rows: string[] = [];

  for (const item of builders.slice(0, 3)) {
    rows.push(`
      <div style="padding:14px 0;border-top:1px solid #e4e4dd">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline">
          <div style="font-size:14px;font-weight:650">${escapeEmailHtml(item.builder.username)}</div>
          <div style="font-size:14px;font-weight:700;color:#86ad22">${item.score}% match</div>
        </div>
        <div style="margin-top:4px;font-size:12px;line-height:1.55;color:#777770">${escapeEmailHtml(item.reasons.slice(0, 2).join(" · ") || (en ? "Open the profile to see what you have in common." : "Review the profile and shared points."))}</div>
        <div style="margin-top:8px;font-size:12px">${smallLink(en ? "View profile" : "Zobacz profil", `/builders/${item.builder.userId}`, baseUrl)}</div>
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
        <div style="margin-top:8px;font-size:12px">${smallLink(en ? "View project" : "Zobacz projekt", `/projects/${item.project.id}`, baseUrl)}</div>
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
        preferredLocale: users.preferredLocale,
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

    const locale: AppLocale = "en";
    const en = locale === "en";
    const builderMatches = builders
      .filter((builder) => builder.userId !== profile.userId)
      .map((builder) => ({ builder, ...builderMatch(profile, builder, locale) }))
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const projectMatches = projects
      .filter((project) => project.ownerId !== profile.userId && project.openRoles.length > 0)
      .map((project) => ({ project, ...projectMatch(profile, project, locale) }))
      .filter((item) => item.score >= 65)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const total = builderMatches.length + projectMatches.length;
    if (total === 0) {
      skipped += 1;
      continue;
    }

    const subject = en
      ? (total === 1 ? "You have a new BuildCrew match" : `${total} BuildCrew matches worth checking`)
      : (total === 1 ? "Masz nowe dopasowanie na BuildCrew" : `${total} dopasowania warte sprawdzenia`);
    const title = en
      ? (total === 1 ? "A new match just appeared" : `You have ${total} matches worth checking`)
      : (total === 1 ? "A new match appeared" : `Masz ${total} dopasowania warte sprawdzenia`);

    const result = await sendTransactionalEmail({
      to: recipient.email,
      subject,
      html: buildCrewEmail({
        locale,
        baseUrl: siteUrlForLocale(locale),
        eyebrow: en ? "Matches" : "Dopasowania",
        title,
        intro: en ? "We only send stronger matches, and no more than once every few days." : "We only send stronger matches and no more than once every few days.",
        content: matchRows(builderMatches, projectMatches, locale),
        ctaLabel: en ? "View matches" : "Zobacz dopasowania",
        ctaHref: "/dashboard",
      }),
      devPreview: en ? `${total} new matches for ${profile.username}` : `${total} new matches for ${profile.username}`,
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

    const locale: AppLocale = "en";
    const en = locale === "en";
    const builderMatches = builders
      .filter((builder) => builder.userId !== profile.userId)
      .map((builder) => ({ builder, ...builderMatch(profile, builder, locale) }))
      .filter((item) => item.score >= 55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const projectMatches = projects
      .filter((project) => project.ownerId !== profile.userId && project.openRoles.length > 0)
      .map((project) => ({ project, ...projectMatch(profile, project, locale) }))
      .filter((item) => item.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const unread = await unreadMessagesCount(recipient.id);
    if (builderMatches.length === 0 && projectMatches.length === 0 && unread === 0) {
      skipped += 1;
      continue;
    }

    const summary = [
      builderMatches.length ? (en ? `${builderMatches.length} ${builderMatches.length === 1 ? "person" : "people"}` : `${builderMatches.length} ${builderMatches.length === 1 ? "osoba" : "osoby"}`) : null,
      projectMatches.length ? (en ? `${projectMatches.length} ${projectMatches.length === 1 ? "project" : "projects"}` : `${projectMatches.length} ${projectMatches.length === 1 ? "projekt" : "projekty"}`) : null,
      unread ? (en ? `${unread} unread ${unread === 1 ? "message" : "messages"}` : `${unread} ${unread === 1 ? "unread message" : "unread messages"}`) : null,
    ].filter(Boolean).join(" · ");

    const baseUrl = siteUrlForLocale(locale);
    const unreadBlock = unread > 0 ? `
      <div style="margin:0 0 18px;padding:12px 14px;background:#f3f8df;border-left:3px solid #c8f169;font-size:13px;line-height:1.55">
        ${en ? `You have <strong>${unread}</strong> unread ${unread === 1 ? "message" : "messages"}.` : `You have <strong>${unread}</strong> ${unread === 1 ? "unread message" : "unread messages"}.`} ${smallLink(en ? "Open messages" : "Open messages", "/messages", baseUrl)}
      </div>` : "";

    const result = await sendTransactionalEmail({
      to: recipient.email,
      subject: en ? `Your week on BuildCrew: ${summary}` : `Your week on BuildCrew: ${summary}`,
      html: buildCrewEmail({
        locale,
        baseUrl,
        eyebrow: en ? "Weekly digest" : "Tygodniowe podsumowanie",
        title: en ? `What to check this week, ${profile.username}` : `Worth checking, ${profile.username}`,
        intro: en ? "A short list of things that could lead to a conversation or a project." : "A short list of things that could lead to a conversation or project.",
        content: `${unreadBlock}${matchRows(builderMatches, projectMatches, locale)}`,
        ctaLabel: en ? "Open BuildCrew" : "Open BuildCrew",
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
