import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Globe, Link2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { COMMITMENT_LABELS, GOAL_LABELS, LEVEL_LABELS, LOOKING_FOR_LABELS, ROLE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/server/data/profiles";
import { getRevealedContact } from "@/server/data/contact";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { BuilderProfileActions } from "@/components/builders/builder-profile-actions";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { getFriendshipState } from "@/server/data/friends";
import { getBuilderBadges, listShowcaseForUser } from "@/server/data/showcase";
import { activityLabel, getActivityState } from "@/lib/activity";
import type { RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileByUserId(id);
  return { title: profile ? `${profile.username} — BuildCrew` : "Profil — BuildCrew" };
}

export default async function BuilderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (user.id !== id && await isBlockedEitherWay(user.id, id)) notFound();
  const profile = await getProfileByUserId(id);
  if (!profile) notFound();

  const [ownedProjects, memberProjects, contact, showcaseEntries, badges] = await Promise.all([
    listProjectsForOwner(id), listProjectsForMember(id), user.id !== id ? getRevealedContact(user.id, id) : Promise.resolve(null), listShowcaseForUser(id), getBuilderBadges(id),
  ]);
  const projects = [...ownedProjects.map((p) => ({ ...p, relation: "Właściciel" })), ...memberProjects.filter((p) => p.ownerId !== id).map((p) => ({ ...p, relation: "Członek zespołu" }))];
  const activityState = getActivityState(profile.lastActiveAt);
  const [myOwnedProjects, friendState] = user.id !== id ? await Promise.all([listProjectsForOwner(user.id), getFriendshipState(user.id, id)]) : [[], { kind: "NONE" as const }];

  return (
    <div>
      <Topbar />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <section className="border-b border-[var(--bc-line)] pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar username={profile.username} seed={profile.userId} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[28px] font-semibold tracking-[-0.03em]">{profile.username}</h1>{profile.isDemo ? <Badge variant="outline">Demo</Badge> : null}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--bc-muted)]"><span>{profile.role ? ROLE_LABELS[profile.role as RoleType] : "Builder"}</span><span>{profile.level ? LEVEL_LABELS[profile.level] : ""}</span><span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${activityState === "TODAY" ? "bg-[var(--bc-accent-strong)]" : "bg-[var(--bc-line-strong)]"}`} />{activityLabel(profile.lastActiveAt)}</span></div>
                {badges.length ? <p className="mt-2 text-[11px] text-[var(--bc-faint)]">{badges.slice(0, 3).map((badge) => badge.label).join(" · ")}</p> : null}
              </div>
            </div>
            {profile.bio ? <p className="mt-5 max-w-[760px] text-[14px] leading-6 text-[var(--bc-muted)]">{profile.bio}</p> : null}
          </section>

          <ProfileSection title="Umiejętności"><TechnologyStack items={profile.skills} max={10} compact /></ProfileSection>
          <ProfileSection title="Dostępność i kierunek">
            <div className="grid gap-4 text-[13px] sm:grid-cols-2">
              <div><p className="text-[11px] text-[var(--bc-faint)]">Czas</p><p className="mt-1 font-medium">{profile.weeklyHours ? COMMITMENT_LABELS[profile.weeklyHours] : "—"}</p></div>
              <div><p className="text-[11px] text-[var(--bc-faint)]">Szukam teraz</p><p className="mt-1 font-medium">{profile.lookingFor.length ? profile.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).join(" · ") : "—"}</p></div>
              <div><p className="text-[11px] text-[var(--bc-faint)]">Obszary</p><p className="mt-1 text-[var(--bc-muted)]">{profile.interests.join(" · ") || "—"}</p></div>
              <div><p className="text-[11px] text-[var(--bc-faint)]">Cele</p><p className="mt-1 text-[var(--bc-muted)]">{profile.goals.map((goal) => GOAL_LABELS[goal]).join(" · ") || "—"}</p></div>
            </div>
          </ProfileSection>

          {showcaseEntries.length > 0 ? <ProfileSection title="Showcase"><SimpleList items={showcaseEntries.map((entry) => ({ href: `/showcase/${entry.id}`, title: entry.title, meta: `${entry.reactionCounts.POTENTIAL} reakcji · ${entry.feedbackCount} komentarzy` }))} /></ProfileSection> : null}
          {projects.length > 0 ? <ProfileSection title="Projekty"><SimpleList items={projects.map((project) => ({ href: `/projects/${project.id}`, title: project.name, meta: project.relation }))} /></ProfileSection> : null}
        </main>

        <aside className="space-y-4">
          {user.id !== id ? <BuilderProfileActions targetUserId={id} myProjects={myOwnedProjects.map((p) => ({ id: p.id, name: p.name }))} friendState={friendState} /> : null}
          {user.id !== id && contact ? <Card className="p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Kontakt</p>{contact.discordUsername ? <p className="mt-2 font-mono text-[13px] font-medium">{contact.discordUsername}</p> : <p className="mt-2 text-[12px] text-[var(--bc-muted)]">Brak Discorda.</p>}</Card> : null}
          {(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl) ? <Card className="p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Linki</p><div className="mt-2 space-y-2 text-[13px]">{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Link2 className="h-3.5 w-3.5" /> GitHub</a> : null}{profile.portfolioUrl ? <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Globe className="h-3.5 w-3.5" /> Portfolio</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Link2 className="h-3.5 w-3.5" /> LinkedIn</a> : null}</div></Card> : null}
        </aside>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-[var(--bc-line)] py-6"><h2 className="mb-3 text-[14px] font-semibold">{title}</h2>{children}</section>;
}

function SimpleList({ items }: { items: { href: string; title: string; meta: string }[] }) {
  return <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{items.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between gap-4 py-3 text-[13px] hover:bg-[var(--bc-surface-subtle)]"><span className="min-w-0 truncate font-medium">{item.title}</span><span className="shrink-0 text-[11px] text-[var(--bc-faint)]">{item.meta}</span></Link>)}</div>;
}
