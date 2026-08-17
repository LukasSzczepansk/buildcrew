import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { AccountSecurity } from "@/components/profile/account-security";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import { AvatarPhotoSettings } from "@/components/profile/avatar-photo-settings";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { countHelpfulAnswersForUser } from "@/server/data/help";
import { getPrivateContact, getProfileByUserId } from "@/server/data/profiles";
import { getProfileAvatarState } from "@/server/data/profile-avatars";
import { listProjectsForMember } from "@/server/data/projects";
import { getNotificationPreferences } from "@/server/data/notifications";
import { getBuilderBadges } from "@/server/data/showcase";
import { listCreditsForUser } from "@/server/data/social-projects";
import { logoutAction } from "@/server/actions/auth";



export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: `${locale === "en" ? "Profile" : "Profile"} - BuildCrew` };
}

export default async function ProfilePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  if (!user) redirect("/login");

  const [profile, privateContact, helpfulCount, projects, notificationPrefs, badges, avatarState, completedCredits] = await Promise.all([
    getProfileByUserId(user.id),
    getPrivateContact(user.id),
    countHelpfulAnswersForUser(user.id),
    listProjectsForMember(user.id),
    getNotificationPreferences(user.id),
    getBuilderBadges(user.id),
    getProfileAvatarState(user.id),
    listCreditsForUser(user.id),
  ]);

  if (!profile || !profile.role || !profile.level || !profile.weeklyHours) redirect("/onboarding");
  const activeProjects = projects.filter((project) => project.lifecycleStatus !== "COMPLETED");

  const matchingGaps = [
    !profile.bio?.trim() ? (en ? "a short bio" : "short bio") : null,
    !profile.headline?.trim() ? (en ? "a headline" : "headline") : null,
    profile.languages.length === 0 ? (en ? "collaboration languages" : "collaboration languages") : null,
    !profile.country ? (en ? "country" : "kraj") : null,
    profile.skills.length < 3 ? (en ? "at least 3 skills" : "at least 3 skills") : null,
    profile.interests.length < 2 ? (en ? "areas you want to build in" : "areas you want to build in") : null,
    profile.lookingFor.length === 0 ? "what opportunities you are open to" : null,
    !profile.githubUrl && !profile.portfolioUrl ? (en ? "GitHub or portfolio" : "GitHub or portfolio") : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <div>
      <Topbar title={en ? "Your profile" : "Your profile"} subtitle={en ? "This is what other builders see and what matching uses." : "This is what other builders see and what matching uses."} />

      <div className="mb-6 flex justify-end lg:hidden">
        <form action={logoutAction}><Button type="submit" variant="outline" size="sm" className="gap-2"><LogOut className="h-4 w-4" /> Log out</Button></form>
      </div>

      <section className="mb-7 grid gap-5 border-b border-[var(--bc-line)] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar username={profile.username} seed={profile.userId} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2 className="truncate text-[20px] font-semibold tracking-[-0.02em]">{profile.username}</h2>
              <span className="text-[13px] text-[var(--bc-muted)]">{labels.roles[profile.role]} · {labels.levels[profile.level]}</span>
            </div>
            {profile.bio ? <p className="bc-truncate-2 mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{profile.bio}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--bc-faint)]">
              <span>{activeProjects.length} active · {completedCredits.length} completed</span>
              <span>{helpfulCount} helpful answers</span>
              {badges.slice(0, 2).map((badge) => <span key={badge.key}>{badge.label}</span>)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href={`/builders/${user.id}`}>{en ? "Preview in BuildCrew" : "Preview on BuildCrew"}</Link></Button>
          {profile.publicProfile ? <Button asChild variant="outline" size="sm"><Link href={`/u/${profile.username}`}>{en ? "Public profile" : "Public profile"} <ExternalLink className="h-3.5 w-3.5" /></Link></Button> : null}
        </div>
      </section>

      {matchingGaps.length ? (
        <section className="mb-6 border-l-[3px] border-[var(--bc-accent)] bg-[var(--bc-surface-subtle)] px-4 py-3">
          <p className="text-[12px] font-semibold">{en ? "Better matches without a fake profile score" : "Better matches without an artificial profile score"}</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--bc-muted)]">{en ? "Add:" : "Complete:"} <span className="font-medium text-[var(--bc-ink)]">{matchingGaps.join(" · ")}</span>. {en ? "BuildCrew uses these signals to recommend people and projects." : "BuildCrew uses this data to recommend people and projects."}</p>
        </section>
      ) : null}

      <AvatarPhotoSettings username={profile.username} initialState={avatarState} />

      <ProfileEditForm
        initial={{
          username: profile.username,
          role: profile.role,
          level: profile.level,
          weeklyHours: profile.weeklyHours,
          bio: profile.bio ?? "",
          headline: profile.headline ?? "",
          country: profile.country ?? "",
          city: profile.city ?? "",
          languages: profile.languages,
          workModePreference: profile.workModePreference,
          skills: profile.skills,
          interests: profile.interests,
          goals: profile.goals,
          lookingFor: profile.lookingFor,
          githubUrl: profile.githubUrl ?? "",
          portfolioUrl: profile.portfolioUrl ?? "",
          linkedinUrl: profile.linkedinUrl ?? "",
          discordUsername: privateContact?.discordUsername ?? "",
          publicProfile: profile.publicProfile,
        }}
      />

      {completedCredits.length ? (
        <section className="mt-7 border-t border-[var(--bc-line)] pt-5">
          <div className="flex items-center justify-between gap-4"><h2 className="text-[16px] font-semibold">Built</h2><span className="text-[12px] text-[var(--bc-faint)]">Projects that are part of your BuildCrew track record.</span></div>
          <div className="mt-2 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {completedCredits.map((credit) => <Link key={credit.creditId} href={`/projects/${credit.projectId}`} className="grid gap-1 py-3.5 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm font-medium">{credit.projectName}</p><p className="mt-0.5 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{credit.outcome || credit.tagline}</p></div><span className="text-[11px] text-[var(--bc-faint)]">{credit.isOwner ? "Owner" : credit.roleType ? labels.roles[credit.roleType] : "Collaborator"}</span></Link>)}
          </div>
        </section>
      ) : null}

      <div className="mt-7"><NotificationPreferencesForm initial={{ emailProjectApplications: notificationPrefs.emailProjectApplications, emailProjectAccepted: notificationPrefs.emailProjectAccepted, emailBuildPool: notificationPrefs.emailBuildPool, emailCrew: notificationPrefs.emailCrew, emailChallenge: notificationPrefs.emailChallenge, emailShowcaseFeedback: notificationPrefs.emailShowcaseFeedback, emailMessages: notificationPrefs.emailMessages, emailWorkspace: notificationPrefs.emailWorkspace, emailMatches: notificationPrefs.emailMatches, emailWeeklyDigest: notificationPrefs.emailWeeklyDigest }} /></div>
      <AccountSecurity hasPassword={user.hasPassword} />

    </div>
  );
}
