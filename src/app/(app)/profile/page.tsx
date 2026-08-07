import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, HelpCircle, LogOut, Rocket } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { AccountSecurity } from "@/components/profile/account-security";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { countHelpfulAnswersForUser } from "@/server/data/help";
import { getPrivateContact, getProfileByUserId } from "@/server/data/profiles";
import { listProjectsForMember } from "@/server/data/projects";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Profil — BuildCrew" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, privateContact, helpfulCount, projects] = await Promise.all([
    getProfileByUserId(user.id),
    getPrivateContact(user.id),
    countHelpfulAnswersForUser(user.id),
    listProjectsForMember(user.id),
  ]);

  if (!profile || !profile.role || !profile.level || !profile.weeklyHours) redirect("/onboarding");

  return (
    <div>
      <Topbar title="Twój profil" subtitle="Ustaw, jak widzą Cię inni builderzy." />

      <div className="mb-4 flex justify-end lg:hidden">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-2 text-neutral-600">
            <LogOut className="h-4 w-4" /> Wyloguj się
          </Button>
        </form>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5 sm:col-span-2">
          <Avatar emoji={profile.avatarEmoji} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{profile.username}</h2>
              <Badge>{ROLE_LABELS[profile.role]}</Badge>
              <Badge variant="secondary">{LEVEL_LABELS[profile.level]}</Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{profile.bio || "Dodaj krótkie bio, żeby inni wiedzieli, co chcesz budować."}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:flex">
            <Link href={`/builders/${user.id}`}>
              Podgląd publiczny <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
        <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-1">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10"><Rocket className="h-4 w-4" /></span>
            <div><p className="text-lg font-semibold">{projects.length}</p><p className="text-xs text-neutral-500">projekty</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10"><HelpCircle className="h-4 w-4" /></span>
            <div><p className="text-lg font-semibold">{helpfulCount}</p><p className="text-xs text-neutral-500">pomocne odpowiedzi</p></div>
          </div>
        </Card>
      </div>

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
      <AccountSecurity hasPassword={user.hasPassword} />
    </div>
  );
}
