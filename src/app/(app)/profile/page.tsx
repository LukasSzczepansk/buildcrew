import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { AccountSecurity } from "@/components/profile/account-security";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { countHelpfulAnswersForUser } from "@/server/data/help";
import { getPrivateContact, getProfileByUserId } from "@/server/data/profiles";
import { listProjectsForMember } from "@/server/data/projects";
import { getNotificationPreferences } from "@/server/data/notifications";
import { getBuilderBadges, listShowcaseForUser } from "@/server/data/showcase";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Profil — BuildCrew" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, privateContact, helpfulCount, projects, notificationPrefs, showcaseEntries, badges] = await Promise.all([
    getProfileByUserId(user.id),
    getPrivateContact(user.id),
    countHelpfulAnswersForUser(user.id),
    listProjectsForMember(user.id),
    getNotificationPreferences(user.id),
    listShowcaseForUser(user.id),
    getBuilderBadges(user.id),
  ]);

  if (!profile || !profile.role || !profile.level || !profile.weeklyHours) redirect("/onboarding");

  return (
    <div>
      <Topbar title="Twój profil" subtitle="To te informacje widzą inni builderzy i wykorzystuje matching." />

      <div className="mb-6 flex justify-end lg:hidden">
        <form action={logoutAction}><Button type="submit" variant="outline" size="sm" className="gap-2"><LogOut className="h-4 w-4" /> Wyloguj</Button></form>
      </div>

      <section className="mb-7 grid gap-5 border-b border-[var(--bc-line)] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar username={profile.username} seed={profile.userId} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2 className="truncate text-[20px] font-semibold tracking-[-0.02em]">{profile.username}</h2>
              <span className="text-[13px] text-[var(--bc-muted)]">{ROLE_LABELS[profile.role]} · {LEVEL_LABELS[profile.level]}</span>
            </div>
            {profile.bio ? <p className="bc-truncate-2 mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{profile.bio}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--bc-faint)]">
              <span>{projects.length} {projects.length === 1 ? "projekt" : "projekty"}</span>
              <span>{helpfulCount} pomocnych odpowiedzi</span>
              {badges.slice(0, 2).map((badge) => <span key={badge.key}>{badge.label}</span>)}
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm"><Link href={`/builders/${user.id}`}>Podgląd publiczny <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
      </section>

      <ProfileEditForm
        initial={{
          username: profile.username,
          role: profile.role,
          level: profile.level,
          weeklyHours: profile.weeklyHours,
          bio: profile.bio ?? "",
          skills: profile.skills,
          interests: profile.interests,
          goals: profile.goals,
          lookingFor: profile.lookingFor,
          githubUrl: profile.githubUrl ?? "",
          portfolioUrl: profile.portfolioUrl ?? "",
          linkedinUrl: profile.linkedinUrl ?? "",
          discordUsername: privateContact?.discordUsername ?? "",
        }}
      />

      {showcaseEntries.length ? (
        <section className="mt-7 border-t border-[var(--bc-line)] pt-5">
          <div className="flex items-center justify-between gap-4"><h2 className="text-[16px] font-semibold">Showcase</h2><Button asChild variant="ghost" size="sm"><Link href="/showcase/new">Dodaj projekt</Link></Button></div>
          <div className="mt-2 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {showcaseEntries.map((entry) => <Link key={entry.id} href={`/showcase/${entry.id}`} className="flex items-center justify-between gap-4 py-3 text-[13px] hover:bg-[var(--bc-surface-subtle)]"><span className="min-w-0 truncate font-medium">{entry.title}</span><span className="shrink-0 text-[11px] text-[var(--bc-faint)]">{entry.reactionCounts.POTENTIAL} reakcji · {entry.feedbackCount} komentarzy</span></Link>)}
          </div>
        </section>
      ) : null}

      <div className="mt-7"><NotificationPreferencesForm initial={{ emailProjectApplications: notificationPrefs.emailProjectApplications, emailProjectAccepted: notificationPrefs.emailProjectAccepted, emailBuildPool: notificationPrefs.emailBuildPool, emailCrew: notificationPrefs.emailCrew, emailChallenge: notificationPrefs.emailChallenge, emailShowcaseFeedback: notificationPrefs.emailShowcaseFeedback, emailMessages: notificationPrefs.emailMessages, emailMatches: notificationPrefs.emailMatches, emailWeeklyDigest: notificationPrefs.emailWeeklyDigest }} /></div>
      <AccountSecurity hasPassword={user.hasPassword} />
    </div>
  );
}
