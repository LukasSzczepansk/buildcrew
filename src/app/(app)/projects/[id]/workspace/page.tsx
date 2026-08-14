import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/server/data/project-workspace";

export const metadata: Metadata = {
  title: "Workspace projektu — BuildCrew",
  robots: { index: false, follow: false },
};

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const data = await getProjectWorkspace(id, user.id);
  if (!data) notFound();

  return (
    <div>
      <Topbar />

      <header className="border-b border-[var(--bc-line)] pb-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
          <Link href={`/projects/${id}`}><ArrowLeft className="h-3.5 w-3.5" /> Projekt</Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)]">Workspace · {data.project.name}</h1>
              <span className="inline-flex items-center gap-1 border border-[var(--bc-line)] px-2 py-1 text-[10px] font-medium text-[var(--bc-muted)]"><LockKeyhole className="h-3 w-3" /> Tylko dla ekipy</span>
            </div>
            <p className="mt-2 max-w-[760px] text-[13px] leading-5 text-[var(--bc-muted)]">Czat, najbliższy cel, proste zadania i linki potrzebne do pracy nad projektem.</p>
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
          profile: member.profile ? { username: member.profile.username, role: member.profile.role } : null,
        }))}
        workspace={data.workspace ? {
          currentFocus: data.workspace.currentFocus,
          milestoneTitle: data.workspace.milestoneTitle,
          milestoneDueAt: data.workspace.milestoneDueAt?.toISOString() ?? null,
          milestoneCompleted: data.workspace.milestoneCompleted,
        } : null}
        messages={data.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender ? { username: message.sender.username } : null,
        }))}
        tasks={data.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          assigneeId: task.assigneeId,
          createdBy: task.createdBy,
          createdAt: task.createdAt.toISOString(),
          assignee: task.assignee ? { username: task.assignee.username } : null,
        }))}
        links={data.links.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          kind: link.kind,
          createdBy: link.createdBy,
        }))}
        activity={data.activity.map((item) => ({
          id: item.id,
          body: item.body,
          createdAt: item.createdAt.toISOString(),
          actor: item.actor ? { username: item.actor.username } : null,
        }))}
      />
    </div>
  );
}
