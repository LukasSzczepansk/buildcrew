import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { InvitationActions } from "@/components/invitations/invitation-actions";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { timeAgo } from "@/lib/utils";
import { listPendingInvitations } from "@/server/data/invitations";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Invitations - BuildCrew" : "Invitations - BuildCrew" }; }
export default async function InvitationsPage() {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const locale = await getRequestLocale(); const en = locale === "en"; const labels = labelsFor(locale); const pending = await listPendingInvitations(user.id);
  return <div className="mx-auto max-w-5xl"><Topbar title={en ? "Invitations" : "Invitations"} subtitle={en ? "Project, team and collaboration invitations." : "Collaboration, team, and project invitations."} />
    {pending.count === 0 ? <div className="border-y border-[var(--bc-line)] py-10 text-center"><Inbox className="mx-auto h-7 w-7 text-[var(--bc-faint)]" /><h2 className="mt-3 font-semibold">{en ? "No pending invitations" : "No pending invitations"}</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">{en ? "Explore " : "Check "}<Link href="/builders" className="font-medium text-[var(--bc-ink)] hover:underline">{en ? "people" : "ludzi"}</Link>{en ? " or " : " or "}<Link href="/projects" className="font-medium text-[var(--bc-ink)] hover:underline">{en ? "projects" : "projects"}</Link>.</p></div> : <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
      {pending.buildProposals.map((item) => <InvitationRow key={item.id} username={item.senderUsername} userId={item.senderId} title={`${item.senderUsername} wants to build something with you`} meta={`${item.senderRole ? labels.roles[item.senderRole] : "Builder"} · ${timeAgo(item.createdAt, locale)}`} message={item.message}><InvitationActions type="BUILD_PROPOSAL" id={item.id} /></InvitationRow>)}
      {pending.crewInvites.map((item) => <InvitationRow key={item.id} username={item.inviterUsername} userId={item.inviterId} title={`${item.inviterUsername} invited you to a team`} meta={timeAgo(item.createdAt, locale)} message={item.message}><InvitationActions type="CREW_INVITE" id={item.id} crewId={item.crewId} /></InvitationRow>)}
      {pending.projectInvites.map((item) => <InvitationRow key={item.id} username={item.inviterUsername} userId={item.inviterId} title={`Invitation to ${item.projectName}`} meta={`From ${item.inviterUsername} · ${timeAgo(item.createdAt, locale)}`} message={item.message || item.projectTagline}><InvitationActions type="PROJECT_INVITE" id={item.id} projectId={item.projectId} /></InvitationRow>)}
    </div>}
  </div>;
}
function InvitationRow({ username, userId, title, meta, message, children }: { username: string; userId: string; title: string; meta: string; message?: string | null; children: React.ReactNode }) { return <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><Avatar username={username} seed={userId} /><div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="mt-0.5 text-[13px] text-[var(--bc-faint)]">{meta}</p>{message ? <p className="mt-1.5 line-clamp-2 text-sm text-[var(--bc-muted)]">{message}</p> : null}</div><div className="shrink-0">{children}</div></div>; }
