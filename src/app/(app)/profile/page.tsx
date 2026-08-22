import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  Eye,
  Code2,
  Globe2,
  Images,
  Link2,
  LogOut,
  MapPin,
  Pencil,
  Settings2,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { AccountSecurity } from "@/components/profile/account-security";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import { AvatarPhotoSettings } from "@/components/profile/avatar-photo-settings";
import { PortfolioManager } from "@/components/portfolio/portfolio-manager";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { disciplineCopy } from "@/lib/profile-disciplines";
import { internationalLabels } from "@/lib/international";
import { locationLabel } from "@/lib/countries";
import { getRequestLocale } from "@/lib/site-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { countHelpfulAnswersForUser } from "@/server/data/help";
import { getPrivateContact, getProfileByUserId } from "@/server/data/profiles";
import { getProfileAvatarState } from "@/server/data/profile-avatars";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { listPortfolioForUser } from "@/server/data/portfolio";
import { getNotificationPreferences } from "@/server/data/notifications";
import { getBuilderBadges } from "@/server/data/showcase";
import { listCreditsForUser } from "@/server/data/social-projects";
import { logoutAction } from "@/server/actions/auth";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: `${locale === "en" ? "Profile" : "Profil"} - BuildCrew` };
}

export default async function ProfilePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const disciplineLabels = disciplineCopy(locale);
  const intl = internationalLabels(locale);
  if (!user) redirect("/login");

  const [profile, privateContact, helpfulCount, projects, ownedProjects, notificationPrefs, badges, avatarState, completedCredits, portfolio] = await Promise.all([
    getProfileByUserId(user.id),
    getPrivateContact(user.id),
    countHelpfulAnswersForUser(user.id),
    listProjectsForMember(user.id),
    listProjectsForOwner(user.id),
    getNotificationPreferences(user.id),
    getBuilderBadges(user.id),
    getProfileAvatarState(user.id),
    listCreditsForUser(user.id),
    listPortfolioForUser(user.id),
  ]);

  if (!profile || !profile.role || !profile.level || !profile.weeklyHours) redirect("/onboarding");
  const activeProjects = projects.filter((project) => project.lifecycleStatus !== "COMPLETED");
  const completion = getProfileCompletion(profile, locale);
  const allProjects = [...ownedProjects, ...projects.filter((project) => !ownedProjects.some((owned) => owned.id === project.id))];
  const location = locationLabel(profile.city, profile.country);
  const profileLinks = [
    profile.githubUrl ? { label: "GitHub", value: profile.githubUrl, icon: Code2 } : null,
    profile.linkedinUrl ? { label: "LinkedIn", value: profile.linkedinUrl, icon: BriefcaseBusiness } : null,
    profile.portfolioUrl ? { label: "Portfolio", value: profile.portfolioUrl, icon: Link2 } : null,
  ].filter(Boolean) as { label: string; value: string; icon: typeof Link2 }[];

  return (
    <div className="pb-10">
      <Topbar
        title={en ? "Your profile" : "Twój profil"}
        subtitle={en ? "Manage how other builders see you and what matching uses." : "Zarządzaj tym, co widzą inni builderzy i z czego korzysta matching."}
      />

      <div className="mb-5 flex justify-end lg:hidden">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-2"><LogOut className="h-4 w-4" /> {en ? "Log out" : "Wyloguj się"}</Button>
        </form>
      </div>

      <section className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="flex min-w-0 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative w-fit shrink-0">
              <Avatar username={profile.username} seed={profile.userId} size="xl" />
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-[var(--bc-surface)] bg-[#6bc72e]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-[26px] font-semibold tracking-[-0.035em]">{profile.username}</h2>
                {profile.lookingFor.length ? <span className="rounded-full bg-[var(--bc-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[#44720e]">{en ? "Open to collaboration" : "Otwarty na współpracę"}</span> : null}
              </div>
              <p className="mt-1 text-[13px] text-[var(--bc-muted)]">
                {labels.roles[profile.role]}{profile.headline ? ` · ${profile.headline}` : ` · ${labels.levels[profile.level]}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[var(--bc-muted)]">
                {location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location}</span> : null}
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {labels.commitments[profile.weeklyHours]}</span>
                {profile.languages.length ? <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> {profile.languages.slice(0, 2).join(" / ")}</span> : null}
              </div>
              {profile.skills.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 6).map((skill) => <span key={skill} className="rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-muted)]">{skill}</span>)}
                  {profile.skills.length > 6 ? <span className="rounded-[6px] border border-[var(--bc-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-faint)]">+{profile.skills.length - 6}</span> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-5 lg:border-l lg:border-t-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold">{en ? "Profile completeness" : "Kompletność profilu"}</p>
                <p className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">{en ? "Better profile, better recommendations." : "Lepszy profil to trafniejsze rekomendacje."}</p>
              </div>
              <strong className="text-[28px] font-semibold tabular-nums tracking-[-0.04em]">{completion.score}%</strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bc-surface-2)]" aria-label={en ? `Profile completeness ${completion.score}%` : `Kompletność profilu ${completion.score}%`}>
              <div className="h-full rounded-full bg-[var(--bc-accent-strong)]" style={{ width: `${completion.score}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              {completion.complete ? (
                <p className="text-[12px] text-[var(--bc-muted)]">{en ? "Your core profile is complete." : "Najważniejsze elementy profilu są uzupełnione."}</p>
              ) : completion.missing.slice(0, 4).map((item) => (
                <a key={item} href="#edit-profile" className="flex items-center justify-between gap-3 text-[11px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">
                  <span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full border border-[var(--bc-line-strong)]" /> <span className="truncate">{item}</span></span>
                  <span className="shrink-0 text-[var(--bc-faint)]">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-2 z-20 mt-3 flex gap-1 overflow-x-auto rounded-[10px] border border-[var(--bc-line)] bg-[color:var(--bc-surface)]/95 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm" aria-label={en ? "Profile sections" : "Sekcje profilu"}>
        <ProfileNavLink href="#overview" icon={UserRound}>{en ? "Overview" : "Przegląd"}</ProfileNavLink>
        <ProfileNavLink href="#portfolio" icon={Images}>Portfolio</ProfileNavLink>
        <ProfileNavLink href="#edit-profile" icon={Pencil}>{en ? "Edit profile" : "Edytuj profil"}</ProfileNavLink>
        <ProfileNavLink href="#settings" icon={Settings2}>{en ? "Settings" : "Ustawienia"}</ProfileNavLink>
      </nav>

      <section id="overview" className="scroll-mt-24 pt-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.8fr)]">
          <div className="space-y-4">
            <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{en ? "About" : "O mnie"}</h2>
                <Button asChild variant="outline" size="sm"><a href="#edit-profile">{en ? "Edit" : "Edytuj"}</a></Button>
              </div>
              <p className="mt-3 max-w-[820px] text-[13px] leading-6 text-[var(--bc-muted)]">
                {profile.bio || (en ? "Add a short description of what you build, what you know and who you want to meet." : "Dodaj krótki opis tego, co budujesz, co potrafisz i z kim chcesz współpracować.")}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryBox icon={UsersRound} title={en ? "Open to" : "Czego szukam"}>
                  {profile.lookingFor.length ? profile.lookingFor.slice(0, 4).map((value) => <span key={value}>{labels.lookingFor[value]}</span>) : <span>{en ? "Not set" : "Nie ustawiono"}</span>}
                </SummaryBox>
                <SummaryBox icon={Sparkles} title={en ? "Areas" : "Obszary"}>
                  {profile.disciplines.length ? profile.disciplines.map((discipline) => <span key={discipline}>{disciplineLabels[discipline].label}</span>) : <span>{labels.roles[profile.role]}</span>}
                </SummaryBox>
                <SummaryBox icon={Clock3} title={en ? "Availability" : "Dostępność"}>
                  <span>{labels.commitments[profile.weeklyHours]}</span>
                  <span>{labels.levels[profile.level]}</span>
                </SummaryBox>
                <SummaryBox icon={Globe2} title={en ? "Work mode" : "Tryb pracy"}>
                  <span>{intl.workMode[profile.workModePreference]}</span>
                  {profile.languages.slice(0, 2).map((language) => <span key={language}>{language}</span>)}
                </SummaryBox>
              </div>
            </section>

            <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-[-0.015em]">Portfolio {portfolio.length ? `(${portfolio.length})` : ""}</h2>
                  <p className="mt-1 text-[12px] text-[var(--bc-faint)]">{en ? "Selected work visible directly on your BuildCrew profile." : "Wybrane prace widoczne bezpośrednio na Twoim profilu BuildCrew."}</p>
                </div>
                <Button asChild variant="outline" size="sm"><a href="#portfolio">{portfolio.length ? (en ? "Manage" : "Zarządzaj") : (en ? "Add work" : "Dodaj pracę")}</a></Button>
              </div>
              {portfolio.length ? <PortfolioGallery items={portfolio.slice(0, 2)} locale={locale} compact /> : (
                <div className="rounded-[9px] border border-dashed border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] px-5 py-8 text-center">
                  <Images className="mx-auto h-5 w-5 text-[var(--bc-faint)]" />
                  <p className="mt-2 text-[13px] font-medium">{en ? "Show what you can actually make" : "Pokaż, co naprawdę potrafisz zrobić"}</p>
                  <p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-[var(--bc-faint)]">{en ? "Add screenshots, designs, interfaces or other visual work." : "Dodaj screeny, projekty, interfejsy albo inne rzeczy, które najlepiej ocenia się wizualnie."}</p>
                </div>
              )}
            </section>

            {completedCredits.length ? (
              <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
                <div className="flex items-center justify-between gap-4"><h2 className="text-[16px] font-semibold">{en ? "Built" : "Zbudowane"}</h2><span className="text-[11px] text-[var(--bc-faint)]">{completedCredits.length}</span></div>
                <div className="mt-3 divide-y divide-[var(--bc-line)]">
                  {completedCredits.slice(0, 4).map((credit) => <Link key={credit.creditId} href={`/projects/${credit.projectId}`} className="grid gap-1 py-3 first:pt-0 last:pb-0 hover:text-[var(--bc-ink)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm font-medium">{credit.projectName}</p><p className="mt-0.5 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{credit.outcome || credit.tagline}</p></div><span className="text-[11px] text-[var(--bc-faint)]">{credit.isOwner ? (en ? "Owner" : "Właściciel") : credit.roleType ? labels.roles[credit.roleType] : (en ? "Collaborator" : "Współtwórca")}</span></Link>)}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
              <div className="flex items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">{en ? "Basic information" : "Podstawowe informacje"}</h2><Button asChild variant="ghost" size="sm"><a href="#edit-profile">{en ? "Edit" : "Edytuj"}</a></Button></div>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                <InfoRow label={en ? "Username" : "Nick"} value={profile.username} />
                <InfoRow label={en ? "Primary role" : "Główna rola"} value={labels.roles[profile.role]} />
                <InfoRow label={en ? "Level" : "Poziom"} value={labels.levels[profile.level]} />
                <InfoRow label={en ? "Location" : "Lokalizacja"} value={location || (en ? "Not set" : "Nie ustawiono")} />
                <InfoRow label={en ? "Languages" : "Języki"} value={profile.languages.length ? profile.languages.join(", ") : (en ? "Not set" : "Nie ustawiono")} />
                <InfoRow label={en ? "Projects" : "Projekty"} value={`${activeProjects.length} ${en ? "active" : "aktywnych"} · ${completedCredits.length} ${en ? "completed" : "ukończonych"}`} />
                {helpfulCount ? <InfoRow label={en ? "Helpful answers" : "Pomocne odpowiedzi"} value={String(helpfulCount)} /> : null}
                {badges[0] ? <InfoRow label={en ? "Badge" : "Wyróżnienie"} value={badges[0].label} /> : null}
              </dl>
            </section>

            <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
              <div className="flex items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">{en ? "Links" : "Linki"}</h2><Button asChild variant="ghost" size="sm"><a href="#edit-profile">{en ? "Edit" : "Edytuj"}</a></Button></div>
              {profileLinks.length ? <div className="mt-3 space-y-1.5">{profileLinks.map(({ label, value, icon: Icon }) => <a key={label} href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-[7px] px-2 py-2 text-[12px] text-[var(--bc-muted)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><Icon className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 truncate">{label}</span><ExternalLink className="h-3 w-3 text-[var(--bc-faint)]" /></a>)}</div> : <p className="mt-3 text-[12px] text-[var(--bc-faint)]">{en ? "Add GitHub, LinkedIn or portfolio." : "Dodaj GitHub, LinkedIn albo zewnętrzne portfolio."}</p>}
            </section>

            <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
              <h2 className="text-[15px] font-semibold">{en ? "Quick actions" : "Szybkie akcje"}</h2>
              <div className="mt-3 grid gap-2">
                <Button asChild className="justify-center gap-2 bg-[var(--bc-accent-soft)] text-[var(--bc-ink)] hover:bg-[var(--bc-accent)]"><a href="#edit-profile"><Pencil className="h-3.5 w-3.5" /> {en ? "Edit profile" : "Edytuj profil"}</a></Button>
                <Button asChild variant="outline" className="justify-center gap-2"><Link href={`/builders/${user.id}`}><Eye className="h-3.5 w-3.5" /> {en ? "Preview profile" : "Podgląd profilu"}</Link></Button>
                {profile.publicProfile ? <><Button asChild variant="outline" className="justify-center gap-2"><Link href={`/u/${profile.username}`}><ExternalLink className="h-3.5 w-3.5" /> {en ? "Public profile" : "Publiczny profil"}</Link></Button><ShareProfileButton userId={user.id} username={profile.username} /></> : null}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section id="portfolio" className="scroll-mt-24 pt-4">
        <PortfolioManager items={portfolio} projects={allProjects.map((project) => ({ id: project.id, name: project.name }))} />
      </section>

      <section id="edit-profile" className="scroll-mt-24 pt-4">
        <ProfileEditForm
          initial={{
            username: profile.username,
            role: profile.role,
            disciplines: profile.disciplines.length ? profile.disciplines : ["OTHER"],
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
      </section>

      <section id="settings" className="scroll-mt-24 pt-4">
        <div className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)] sm:px-6">
          <div className="flex items-center gap-2 border-b border-[var(--bc-line)] py-5">
            <Wrench className="h-4 w-4 text-[var(--bc-muted)]" />
            <div><h2 className="text-[16px] font-semibold">{en ? "Profile settings" : "Ustawienia profilu"}</h2><p className="mt-0.5 text-[12px] text-[var(--bc-faint)]">{en ? "Photo, notifications and account security." : "Zdjęcie, powiadomienia i bezpieczeństwo konta."}</p></div>
          </div>
          <AvatarPhotoSettings username={profile.username} initialState={avatarState} />
          <div className="border-t border-[var(--bc-line)] py-1"><NotificationPreferencesForm initial={{ emailProjectApplications: notificationPrefs.emailProjectApplications, emailProjectAccepted: notificationPrefs.emailProjectAccepted, emailBuildPool: notificationPrefs.emailBuildPool, emailCrew: notificationPrefs.emailCrew, emailChallenge: notificationPrefs.emailChallenge, emailShowcaseFeedback: notificationPrefs.emailShowcaseFeedback, emailMessages: notificationPrefs.emailMessages, emailWorkspace: notificationPrefs.emailWorkspace, emailMatches: notificationPrefs.emailMatches, emailWeeklyDigest: notificationPrefs.emailWeeklyDigest }} /></div>
          <div className="border-t border-[var(--bc-line)] py-1"><AccountSecurity hasPassword={user.hasPassword} /></div>
        </div>
      </section>
    </div>
  );
}

function ProfileNavLink({ href, icon: Icon, children }: { href: string; icon: typeof UserRound; children: ReactNode }) {
  return <a href={href} className="inline-flex shrink-0 items-center gap-2 rounded-[7px] px-3 py-2 text-[12px] font-medium text-[var(--bc-muted)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><Icon className="h-3.5 w-3.5" />{children}</a>;
}

function SummaryBox({ icon: Icon, title, children }: { icon: typeof BriefcaseBusiness; title: string; children: ReactNode }) {
  return (
    <div className="min-h-[118px] rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-3.5">
      <div className="flex items-center gap-2 text-[12px] font-semibold"><Icon className="h-3.5 w-3.5 text-[var(--bc-muted)]" />{title}</div>
      <div className="mt-2.5 flex flex-col gap-1 text-[11px] leading-4 text-[var(--bc-muted)]">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3"><dt className="text-[var(--bc-faint)]">{label}</dt><dd className="min-w-0 break-words text-[var(--bc-muted)]">{value}</dd></div>;
}
