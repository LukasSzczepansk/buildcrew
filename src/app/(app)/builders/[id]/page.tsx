import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Globe, Link2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { labelsFor } from "@/lib/constants-i18n";
import { disciplineCopy } from "@/lib/profile-disciplines";
import { getRequestLocale } from "@/lib/site-server";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/server/data/profiles";
import { getRevealedContact } from "@/server/data/contact";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { BuilderProfileActions } from "@/components/builders/builder-profile-actions";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { getFriendshipState } from "@/server/data/friends";
import { getBuilderBadges } from "@/server/data/showcase";
import { CollaborationEndorsementDialog } from "@/components/network/collaboration-endorsement-dialog";
import { getCollaborationContext, getEndorsementSummary, getFollowState, getMutualCollaborators, getNetworkCounts } from "@/server/data/network";
import { activityLabel, getActivityState } from "@/lib/activity";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { locationLabel } from "@/lib/countries";
import { listCreditsForUser } from "@/server/data/social-projects";
import { listPortfolioForUser } from "@/server/data/portfolio";
import type { RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const profile = await getProfileByUserId(id);
  return { title: profile ? `${profile.username} - BuildCrew` : `${locale === "en" ? "Profile" : "Profil"} - BuildCrew` };
}

export default async function BuilderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const disciplineLabels = disciplineCopy(locale);
  const { id } = await params;
  if (user.id !== id && await isBlockedEitherWay(user.id, id)) notFound();
  const profile = await getProfileByUserId(id);
  if (!profile) notFound();

  const [ownedProjects, memberProjects, contact, badges, networkCounts, endorsementSummary, completedCredits, portfolio] = await Promise.all([
    listProjectsForOwner(id), listProjectsForMember(id), user.id !== id ? getRevealedContact(user.id, id) : Promise.resolve(null), getBuilderBadges(id), getNetworkCounts(id), getEndorsementSummary(id), listCreditsForUser(id), listPortfolioForUser(id),
  ]);
  const projects = [...ownedProjects.map((p) => ({ ...p, relation: en ? "Owner" : "Autor" })), ...memberProjects.filter((p) => p.ownerId !== id).map((p) => ({ ...p, relation: en ? "Team member" : "Członek zespołu" }))];
  const activityState = getActivityState(profile.lastActiveAt);
  const opportunityStatus = opportunityStatusLabel(profile.lookingFor, locale);
  const [myOwnedProjects, friendState, initialFollowing, collaborationContext, mutualCollaborators] = user.id !== id
    ? await Promise.all([listProjectsForOwner(user.id), getFriendshipState(user.id, id), getFollowState(user.id, id), getCollaborationContext(user.id, id), getMutualCollaborators(user.id, id)])
    : [[], { kind: "NONE" as const }, false, { sharedProjects: [], existingEndorsements: [], summary: [] }, []];

  return (
    <div>
      <Topbar />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <section className="border-b border-[var(--bc-line)] pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar username={profile.username} seed={profile.userId} size="lg" className={profile.isFounder ? "ring-2 ring-[#C8F169] ring-offset-2 ring-offset-[var(--bc-canvas)]" : undefined} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[28px] font-semibold tracking-[-0.03em]">{profile.username}</h1><UserRoleBadge systemRole={profile.systemRole} founder={profile.isFounder} />{profile.isDemo ? <Badge variant="outline">BuildCrew Lab</Badge> : null}</div>
                <p className="mt-1 text-sm font-medium text-[var(--bc-ink)]">{profile.headline || (profile.role ? labels.roles[profile.role as RoleType] : "Builder")}</p>{(profile.city || profile.country) ? <p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">{locationLabel(profile.city, profile.country)}</p> : null}<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--bc-muted)]"><span>{profile.role ? labels.roles[profile.role as RoleType] : "Builder"}</span><span>{profile.level ? labels.levels[profile.level] : ""}</span><span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${activityState === "TODAY" ? "bg-[var(--bc-accent-strong)]" : "bg-[var(--bc-line-strong)]"}`} />{activityLabel(profile.lastActiveAt, locale)}</span></div>
                {profile.disciplines.length ? <div className="mt-2 flex flex-wrap gap-1.5">{profile.disciplines.map((discipline) => <span key={discipline} className="border border-[var(--bc-line)] px-2 py-0.5 text-[10px] font-medium text-[var(--bc-muted)]">{disciplineLabels[discipline].label}</span>)}</div> : null}
                {opportunityStatus ? <div className="mt-2 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--bc-ink)]"><span className="h-2 w-2 rounded-full bg-[var(--bc-accent-strong)]" />{opportunityStatus}</div> : null}
                {badges.length ? <p className="mt-2 text-[12px] text-[var(--bc-faint)]">{badges.slice(0, 3).map((badge) => badge.label).join(" · ")}</p> : null}
              </div>
            </div>
            {profile.bio ? <p className="mt-5 max-w-[760px] text-[14px] leading-6 text-[var(--bc-muted)]">{profile.bio}</p> : null}
            {profile.isFounder ? <div className="mt-4 max-w-[760px] rounded-[7px] border border-[#b6dc55] bg-[#C8F169]/25 px-3.5 py-3 text-[13px] leading-5 text-[var(--bc-ink)]"><strong className="font-semibold">{en ? "I’m building BuildCrew." : "Buduję BuildCrew."}</strong> {en ? "Have feedback, found a problem, or have an idea for the platform? Message me." : "Masz feedback, znalazłeś problem albo masz pomysł na platformę? Napisz do mnie."}</div> : null}
          </section>

          {portfolio.length ? <ProfileSection title="Portfolio"><PortfolioGallery items={portfolio} locale={locale} /></ProfileSection> : null}
          <ProfileSection title={en ? "Skills" : "Umiejętności"}><TechnologyStack items={profile.skills} max={10} compact /></ProfileSection>
          <ProfileSection title={en ? "Availability and collaboration" : "Dostępność i współpraca"}>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Time" : "Czas"}</p><p className="mt-1 font-medium">{profile.weeklyHours ? labels.commitments[profile.weeklyHours] : "-"}</p></div>
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Open to" : "Otwartość"}</p><p className="mt-1 font-medium">{profile.lookingFor.length ? profile.lookingFor.map((item) => labels.lookingFor[item]).join(" · ") : "-"}</p></div>
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Interests" : "Obszary"}</p><p className="mt-1 text-[var(--bc-muted)]">{profile.interests.join(" · ") || "-"}</p></div>
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Goals" : "Cele"}</p><p className="mt-1 text-[var(--bc-muted)]">{profile.goals.map((goal) => labels.goals[goal]).join(" · ") || "-"}</p></div>
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Location" : "Lokalizacja"}</p><p className="mt-1 font-medium">{locationLabel(profile.city, profile.country) || "-"}</p></div>
              <div><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Languages" : "Języki"}</p><p className="mt-1 text-[var(--bc-muted)]">{profile.languages.join(" · ") || "-"}</p></div>
            </div>
          </ProfileSection>

          {completedCredits.length > 0 ? (
            <ProfileSection title={en ? "Built on BuildCrew" : "Zbudowane na BuildCrew"}>
              <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                {completedCredits.map((credit) => (
                  <Link key={credit.creditId} href={`/projects/${credit.projectId}`} className="grid gap-2 py-4 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--bc-ink)]">{credit.projectName}</p>
                      <p className="mt-1 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{credit.outcome || credit.tagline}</p>
                    </div>
                    <div className="text-[12px] text-[var(--bc-faint)] sm:text-right">
                      <p>{credit.isOwner ? (en ? "Owner" : "Autor") : credit.roleType ? labels.roles[credit.roleType] : (en ? "Collaborator" : "Współtwórca")}</p>
                      {credit.completedAt ? <p className="mt-0.5">{credit.completedAt.toLocaleDateString(en ? "en-US" : "pl-PL", { month: "short", year: "numeric" })}</p> : null}
                    </div>
                  </Link>
                ))}
              </div>
            </ProfileSection>
          ) : null}
          {projects.length > 0 ? <ProfileSection title={en ? "Active projects" : "Aktywne projekty"}><SimpleList items={projects.filter((project) => project.lifecycleStatus !== "COMPLETED").map((project) => ({ href: `/projects/${project.id}`, title: project.name, meta: project.relation }))} /></ProfileSection> : null}

          {(endorsementSummary.total > 0 || networkCounts.collaborators > 0) ? (
            <ProfileSection title={en ? "Collaboration history" : "Historia współpracy"}>
              <div className="grid gap-5 sm:grid-cols-3">
                <div><p className="text-[20px] font-semibold tabular-nums">{networkCounts.collaborators}</p><p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "collaborators" : "współpracowników"}</p></div>
                <div><p className="text-[20px] font-semibold tabular-nums">{endorsementSummary.total}</p><p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "endorsements" : "rekomendacji"}</p></div>
                <div><p className="text-[20px] font-semibold tabular-nums">{endorsementSummary.wouldAgain}</p><p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "would work again" : "chcą współpracować ponownie"}</p></div>
              </div>
              {endorsementSummary.strengths.length ? <p className="mt-4 text-[13px] text-[var(--bc-muted)]">{en ? "Most endorsed for:" : "Najczęściej polecany za:"} <span className="font-medium text-[var(--bc-ink)]">{endorsementSummary.strengths.slice(0, 4).map((item) => `${item.label} (${item.count})`).join(" · ")}</span></p> : null}
            </ProfileSection>
          ) : null}
        </main>

        <aside className="space-y-4">
          {user.id !== id ? <BuilderProfileActions targetUserId={id} myProjects={myOwnedProjects.map((p) => ({ id: p.id, name: p.name }))} friendState={friendState} initialFollowing={initialFollowing} /> : null}
          {user.id !== id && mutualCollaborators.length ? <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Mutual collaborators" : "Wspólni współpracownicy"}</p><p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">{en ? "You share context through" : "Macie wspólny kontekst przez"} <span className="font-medium text-[var(--bc-ink)]">{mutualCollaborators.map((person) => person.username).join(" · ")}</span>. {en ? "This is a stronger signal than a random connection request." : "To mocniejszy sygnał niż przypadkowe zaproszenie do kontaktów."}</p></Card> : null}
          {user.id !== id && collaborationContext.sharedProjects.length ? <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Shared history" : "Wspólna historia"}</p><p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">{en ? `You worked together on ${collaborationContext.sharedProjects.length === 1 ? "a project" : "projects"}:` : `Współpracowaliście przy ${collaborationContext.sharedProjects.length === 1 ? "projekcie" : "projektach"}:`} <span className="font-medium text-[var(--bc-ink)]">{collaborationContext.sharedProjects.map((project) => project.name).join(" · ")}</span></p><div className="mt-3"><CollaborationEndorsementDialog targetUserId={id} targetUsername={profile.username} projects={collaborationContext.sharedProjects} defaultProjectId={collaborationContext.sharedProjects[0]?.id} /></div></Card> : null}
          <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Network" : "Sieć"}</p><div className="mt-3 grid grid-cols-3 gap-3"><div><p className="text-[16px] font-semibold tabular-nums">{networkCounts.followers}</p><p className="text-[11px] text-[var(--bc-faint)]">{en ? "followers" : "obserwujący"}</p></div><div><p className="text-[16px] font-semibold tabular-nums">{networkCounts.collaborators}</p><p className="text-[11px] text-[var(--bc-faint)]">{en ? "collabs" : "współprace"}</p></div><div><p className="text-[16px] font-semibold tabular-nums">{networkCounts.endorsements}</p><p className="text-[11px] text-[var(--bc-faint)]">{en ? "endorsements" : "rekomendacje"}</p></div></div>{profile.publicProfile ? <Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-between"><Link href={`/u/${profile.username}`}>{en ? "Public profile" : "Publiczny profil"} <ExternalLink className="h-3.5 w-3.5" /></Link></Button> : null}</Card>
          {user.id !== id && contact ? <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Contact" : "Kontakt"}</p>{contact.discordUsername ? <p className="mt-2 font-mono text-sm font-medium">{contact.discordUsername}</p> : <p className="mt-2 text-[13px] text-[var(--bc-muted)]">{en ? "No Discord provided." : "Brak nazwy użytkownika Discord."}</p>}</Card> : null}
          {(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl) ? <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Links" : "Linki"}</p><div className="mt-2 space-y-2 text-sm">{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Link2 className="h-3.5 w-3.5" /> GitHub</a> : null}{profile.portfolioUrl ? <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Globe className="h-3.5 w-3.5" /> Portfolio</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Link2 className="h-3.5 w-3.5" /> LinkedIn</a> : null}</div></Card> : null}
        </aside>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-[var(--bc-line)] py-6"><h2 className="mb-3 text-[14px] font-semibold">{title}</h2>{children}</section>;
}

function SimpleList({ items }: { items: { href: string; title: string; meta: string }[] }) {
  return <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{items.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-[var(--bc-surface-subtle)]"><span className="min-w-0 truncate font-medium">{item.title}</span><span className="shrink-0 text-[12px] text-[var(--bc-faint)]">{item.meta}</span></Link>)}</div>;
}
