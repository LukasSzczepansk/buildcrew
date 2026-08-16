import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, LockKeyhole, Settings2, UserPlus, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectIdentityMark } from "@/components/projects/project-identity-mark";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { Button } from "@/components/ui/button";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/server/data/project-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Project workspace - BuildCrew" : "Project workspace - BuildCrew", robots: { index: false, follow: false } };
}

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const { id } = await params;
  const data = await getProjectWorkspace(id, user.id);
  if (!data) notFound();

  const isOwner = data.project.ownerId === user.id;

  return (
    <div>
      <Topbar />

      <header className="border-b border-[var(--bc-line)] pb-5 pt-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href={`/projects/${id}`}><ArrowLeft className="h-3.5 w-3.5" /> {en ? "Project" : "Project"}</Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/builders"><UserPlus className="h-3.5 w-3.5" /> {en ? "Find someone" : "Find a person"}</Link>
              </Button>
            ) : null}
            {isOwner ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${id}/manage`}><Settings2 className="h-3.5 w-3.5" /> {en ? "Manage" : "Manage"}</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${id}`}><ExternalLink className="h-3.5 w-3.5" /> {en ? "Project view" : "Project view"}</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <ProjectIdentityMark
            name={data.project.name}
            tagline={data.project.tagline}
            projectType={data.project.projectType}
            technologies={data.technologies}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">{data.project.name}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[var(--bc-line)] px-2 py-1 text-[11px] font-medium text-[var(--bc-muted)]">
                <LockKeyhole className="h-3 w-3" /> {en ? "Private workspace" : "Private workspace"}
              </span>
            </div>
            <p className="mt-1.5 max-w-[760px] text-sm leading-5 text-[var(--bc-muted)]">{data.project.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--bc-faint)]">
              <span>{labels.stages[data.project.stage]}</span>
              {data.project.projectType ? <span>{labels.projectTypes[data.project.projectType]}</span> : null}
              {data.project.commitment ? <span>{labels.commitments[data.project.commitment]}</span> : null}
              <span className="inline-flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" /> {data.members.length} {en ? (data.members.length === 1 ? "person" : "people") : (data.members.length === 1 ? "person" : data.members.length < 5 ? "people" : "people")}</span>
            </div>
          </div>
        </div>
      </header>

      <ProjectWorkspace
        projectId={id}
        projectOwnerId={data.project.ownerId}
        viewerId={user.id}
        members={data.members.map((member) => ({
          userId: member.userId,
          isOwner: member.isOwner,
          roleType: member.roleType,
          profile: member.profile ? {
            username: member.profile.username,
            role: member.profile.role,
            lastActiveAt: member.profile.lastActiveAt?.toISOString() ?? null,
          } : null,
        }))}
        workspace={data.workspace ? {
          currentFocus: data.workspace.currentFocus,
          milestoneTitle: data.workspace.milestoneTitle,
          milestoneDescription: data.workspace.milestoneDescription,
          milestoneDueAt: data.workspace.milestoneDueAt?.toISOString() ?? null,
          milestoneStatus: data.workspace.milestoneCompleted ? "DONE" : data.workspace.milestoneStatus,
          milestoneCompleted: data.workspace.milestoneCompleted,
        } : null}
        messages={data.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          replyToId: message.replyToId,
          editedAt: message.editedAt?.toISOString() ?? null,
          deletedAt: message.deletedAt?.toISOString() ?? null,
          pinnedAt: message.pinnedAt?.toISOString() ?? null,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender ? { username: message.sender.username } : null,
          replyTo: message.replyTo ? {
            id: message.replyTo.id,
            senderId: message.replyTo.senderId,
            body: message.replyTo.body,
            deletedAt: message.replyTo.deletedAt?.toISOString() ?? null,
            sender: message.replyTo.sender ? { username: message.replyTo.sender.username } : null,
          } : null,
          reactions: message.reactions,
        }))}
        pinnedMessages={data.pinnedMessages.map((message) => ({
          id: message.id,
          body: message.body,
          sender: message.sender ? { username: message.sender.username } : null,
          createdAt: message.createdAt.toISOString(),
        }))}
        unreadCount={data.unreadCount}
        lastReadAt={data.lastReadAt?.toISOString() ?? null}
        tasks={data.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          assigneeId: task.assigneeId,
          dueAt: task.dueAt?.toISOString() ?? null,
          sourceMessageId: task.sourceMessageId,
          createdBy: task.createdBy,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          assignee: task.assignee ? { username: task.assignee.username } : null,
        }))}
        links={data.links.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          kind: link.kind,
          createdBy: link.createdBy,
          createdAt: link.createdAt.toISOString(),
        }))}
        activity={data.activity.map((item) => ({
          id: item.id,
          type: item.type,
          body: item.body,
          createdAt: item.createdAt.toISOString(),
          actor: item.actor ? { username: item.actor.username } : null,
        }))}
      />
    </div>
  );
}
