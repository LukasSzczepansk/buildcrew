import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { labelsFor } from "@/lib/constants-i18n";
import { disciplineCopy } from "@/lib/profile-disciplines";
import { internationalLabels } from "@/lib/international";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { locationLabel } from "@/lib/countries";
import { getRequestLocale } from "@/lib/site-server";
import { siteUrlForLocale } from "@/lib/site-config";
import { getActivityState, activityLabel } from "@/lib/activity";
import { getEndorsementSummary, getNetworkCounts, getPublicProfileByUsername } from "@/server/data/network";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { listCreditsForUser } from "@/server/data/social-projects";
import { listPortfolioForUser } from "@/server/data/portfolio";
import type { RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const [{ username }, locale] = await Promise.all([params, getRequestLocale()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const profile = await getPublicProfileByUsername(decodeURIComponent(username));
  if (!profile) return { title: `${en ? "Profile unavailable" : "Profil niedostępny"} | BuildCrew`, robots: { index: false, follow: false } };
  const role = profile.role ? labels.roles[profile.role as RoleType] : (en ? "Builder" : "Twórca");
  const skills = profile.skills.slice(0, 5).join(", ");
  const description = profile.bio?.trim() || (en ? `${role} on BuildCrew. Skills: ${skills || "builder profile"}.` : `${role} na BuildCrew. Umiejętności: ${skills || "profil buildera"}.`);
  return {
    title: `${profile.username} - ${role} | BuildCrew`,
    description,
    alternates: { canonical: `/u/${profile.username}` },
    robots: profile.isDemo ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: `/u/${profile.username}`,
      title: `${profile.username} - ${role}`,
      description,
      siteName: "BuildCrew",
      images: [`/api/profiles/${profile.userId}/share-card`],
    },
    twitter: { card: "summary_large_image", title: `${profile.username} - ${role}`, description, images: [`/api/profiles/${profile.userId}/share-card`] },
  };
}

export default async function PublicBuilderProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [{ username }, locale] = await Promise.all([params, getRequestLocale()]);
  const en = locale === "en";
  const labels = labelsFor(locale);
  const disciplineLabels = disciplineCopy(locale);
  const intl = internationalLabels(locale);
  const profile = await getPublicProfileByUsername(decodeURIComponent(username));
  if (!profile) notFound();
  const [ownedProjects, memberProjects, counts, endorsements, completedCredits, portfolio] = await Promise.all([
    listProjectsForOwner(profile.userId),
    listProjectsForMember(profile.userId),
    getNetworkCounts(profile.userId),
    getEndorsementSummary(profile.userId),
    listCreditsForUser(profile.userId),
    listPortfolioForUser(profile.userId),
  ]);
  const projects = [
    ...ownedProjects.filter((project) => project.lifecycleStatus !== "COMPLETED").map((project) => ({ id: project.id, name: project.name, tagline: project.tagline, relation: en ? "Owner" : "Autor" })),
    ...memberProjects.filter((project) => project.ownerId !== profile.userId && project.lifecycleStatus !== "COMPLETED").map((project) => ({ id: project.id, name: project.name, tagline: project.tagline, relation: en ? "Team member" : "Członek zespołu" })),
  ];
  const opportunityStatus = opportunityStatusLabel(profile.lookingFor, locale);
  const activityState = getActivityState(profile.lastActiveAt);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.username,
    url: `${siteUrlForLocale(locale)}/u/${encodeURIComponent(profile.username)}`,
    knowsAbout: profile.skills.slice(0, 12),
  };

  return (
    <main className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }} />
      <header className="border-b border-[var(--bc-line)] bg-[var(--bc-surface)]">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-[15px] font-semibold tracking-[-0.02em]">BuildCrew</Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><Button asChild variant="outline" size="sm"><Link href="/explore/projects">{en ? "Projects" : "Projekty"}</Link></Button><Button asChild size="sm"><Link href="/signup">{en ? "Join BuildCrew" : "Dołącz do BuildCrew"}</Link></Button></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-5 py-9 sm:px-8 sm:py-12">
        <section className="grid gap-8 border-b border-[var(--bc-line)] pb-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex items-start gap-4">
              <Avatar username={profile.username} seed={profile.userId} size="lg" className={profile.isFounder ? "ring-2 ring-[#C8F169] ring-offset-2 ring-offset-[var(--bc-canvas)]" : undefined} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[30px] font-semibold tracking-[-0.03em]">{profile.username}</h1><UserRoleBadge systemRole={profile.systemRole} founder={profile.isFounder} />{profile.isDemo ? <span className="rounded-full border border-[var(--bc-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">BuildCrew Lab</span> : null}{opportunityStatus ? <span className="inline-flex items-center gap-1.5 text-[12px] font-medium"><span className="h-2 w-2 rounded-full bg-[var(--bc-accent-strong)]" />{opportunityStatus}</span> : null}</div>
                <p className="mt-1 text-sm text-[var(--bc-muted)]">{profile.headline || (profile.role ? labels.roles[profile.role as RoleType] : (en ? "Builder" : "Twórca"))} · {activityState === "TODAY" ? activityLabel(profile.lastActiveAt, locale) : (en ? "BuildCrew profile" : "profil BuildCrew")}</p>
                {(profile.city || profile.country) ? <p className="mt-1 text-[13px] font-medium text-[var(--bc-ink)]">{locationLabel(profile.city, profile.country)}</p> : null}
                {profile.disciplines.length ? <div className="mt-2 flex flex-wrap gap-1.5">{profile.disciplines.map((discipline) => <span key={discipline} className="border border-[var(--bc-line)] px-2 py-0.5 text-[10px] font-medium text-[var(--bc-muted)]">{disciplineLabels[discipline].label}</span>)}</div> : null}
              </div>
            </div>
            {profile.bio ? <p className="mt-5 max-w-[760px] text-[15px] leading-6 text-[var(--bc-muted)]">{profile.bio}</p> : null}
            {profile.isFounder ? <p className="mt-3 max-w-[760px] border-l-2 border-[#C8F169] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]"><strong className="font-semibold text-[var(--bc-ink)]">{en ? "BuildCrew founder." : "Twórca BuildCrew."}</strong> {en ? "I’m building the platform and collecting feedback from the community." : "Buduję platformę i zbieram feedback od społeczności."}</p> : null}
            <div className="mt-5"><TechnologyStack items={profile.skills} max={8} compact /></div>
          </div>

          <aside className="border-l-0 border-[var(--bc-line)] lg:border-l lg:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Proof of collaboration" : "Dorobek współpracy"}</p>
            <div className="mt-3 grid grid-cols-3 gap-4"><Metric value={counts.collaborators} label={en ? "collabs" : "współprace"} /><Metric value={counts.followers} label={en ? "followers" : "obserwujący"} /><Metric value={endorsements.total} label={en ? "endorsements" : "rekomendacje"} /></div>
            {endorsements.strengths.length ? <p className="mt-4 text-[12px] leading-5 text-[var(--bc-muted)]">{en ? "Endorsed for:" : "Polecany za:"} <span className="font-medium text-[var(--bc-ink)]">{endorsements.strengths.slice(0, 3).map((item) => item.label).join(" · ")}</span></p> : null}
          </aside>
        </section>

        <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            {completedCredits.length ? (
              <PublicSection title={en ? "Built" : "Zbudował/a"}>
                <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                  {completedCredits.map((credit) => <Link key={credit.creditId} href={`/p/${credit.projectId}`} className="grid gap-1 py-3.5 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm font-medium">{credit.projectName}</p><p className="mt-0.5 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{credit.outcome || credit.tagline}</p></div><span className="text-[11px] text-[var(--bc-faint)]">{credit.isOwner ? (en ? "Owner" : "Autor") : credit.roleType ? labels.roles[credit.roleType] : (en ? "Collaborator" : "Współtwórca")}</span></Link>)}
                </div>
              </PublicSection>
            ) : null}

            <PublicSection title={en ? "Building now" : "Buduje teraz"}>
              {projects.length ? <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{projects.map((project) => <Link key={`${project.id}-${project.relation}`} href={`/p/${project.id}`} className="grid gap-1 py-3.5 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm font-medium">{project.name}</p><p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{project.tagline}</p></div><span className="text-[11px] text-[var(--bc-faint)]">{project.relation}</span></Link>)}</div> : <p className="text-[13px] text-[var(--bc-muted)]">{en ? "No active public projects right now." : "Brak aktywnych publicznych projektów w tej chwili."}</p>}
            </PublicSection>

            {portfolio.length ? <PublicSection title="Portfolio"><PortfolioGallery items={portfolio} locale={locale} /></PublicSection> : null}

            <PublicSection title={en ? "Open to collaborate" : "Otwartość na współpracę"}>
              <p className="text-sm leading-6 text-[var(--bc-muted)]">{profile.lookingFor.map((item) => labels.lookingFor[item]).join(" · ") || (en ? "No information" : "Brak informacji")}</p>
              <p className="mt-2 text-[13px] text-[var(--bc-faint)]">{en ? "Availability:" : "Dostępność:"} {profile.weeklyHours ? labels.commitments[profile.weeklyHours] : "-"}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--bc-faint)]">
                {profile.languages.length ? <span>{en ? "Languages:" : "Języki:"} {profile.languages.join(", ")}</span> : null}
                {(profile.city || profile.country) ? <span className="font-medium text-[var(--bc-ink)]">{locationLabel(profile.city, profile.country)}</span> : null}
                {profile.workModePreference ? <span>{intl.workMode[profile.workModePreference]}</span> : null}
              </div>
            </PublicSection>


            {endorsements.total ? <PublicSection title={en ? "Confirmed collaboration" : "Potwierdzona współpraca"}><p className="text-sm leading-6 text-[var(--bc-muted)]">{en ? `${endorsements.wouldAgain} of ${endorsements.total} people said they would gladly work with this builder again.` : `${endorsements.wouldAgain} z ${endorsements.total} osób zadeklarowało, że chętnie współpracowałoby z tą osobą ponownie.`}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">{endorsements.strengths.slice(0, 6).map((item) => <span key={item.key}><strong className="font-semibold text-[var(--bc-ink)]">{item.count}</strong> {item.label}</span>)}</div></PublicSection> : null}
          </div>

          <aside>
            <div className="border-y border-[var(--bc-line)] py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Direction" : "Kierunek"}</p>
              <dl className="mt-3 space-y-3 text-[13px]"><div><dt className="text-[11px] text-[var(--bc-faint)]">{en ? "Interests" : "Obszary"}</dt><dd className="mt-0.5 text-[var(--bc-ink)]">{profile.interests.join(" · ") || "-"}</dd></div><div><dt className="text-[11px] text-[var(--bc-faint)]">{en ? "Goals" : "Cele"}</dt><dd className="mt-0.5 text-[var(--bc-ink)]">{profile.goals.map((goal) => labels.goals[goal]).join(" · ") || "-"}</dd></div></dl>
            </div>
            {(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl) ? <div className="border-b border-[var(--bc-line)] py-4"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Links" : "Linki"}</p><div className="mt-3 space-y-2 text-[13px]">{profile.githubUrl ? <PublicLink href={profile.githubUrl}>GitHub</PublicLink> : null}{profile.portfolioUrl ? <PublicLink href={profile.portfolioUrl}>Portfolio</PublicLink> : null}{profile.linkedinUrl ? <PublicLink href={profile.linkedinUrl}>LinkedIn</PublicLink> : null}</div></div> : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) { return <div><p className="text-[19px] font-semibold tabular-nums">{value}</p><p className="text-[11px] text-[var(--bc-faint)]">{label}</p></div>; }
function PublicSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="mb-3 text-[16px] font-semibold">{title}</h2>{children}</section>; }
function PublicLink({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 hover:underline"><span>{children}</span><ExternalLink className="h-3.5 w-3.5" /></a>; }
