"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LockKeyhole, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS } from "@/lib/constants";
import type { RoleType } from "@/db/schema";
import {
  addProjectWorkspaceLink,
  addProjectWorkspaceTask,
  deleteProjectWorkspaceLink,
  deleteProjectWorkspaceMessage,
  deleteProjectWorkspaceTask,
  sendProjectWorkspaceMessage,
  updateProjectWorkspaceOverview,
  updateProjectWorkspaceTaskStatus,
} from "@/server/actions/project-workspace";

type WorkspaceMember = {
  userId: string;
  isOwner: boolean;
  roleType: RoleType | null;
  profile: { username: string; role: RoleType | null } | null;
};

type WorkspaceMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { username: string } | null;
};

type WorkspaceTask = {
  id: string;
  title: string;
  status: "TODO" | "DOING" | "DONE";
  assigneeId: string | null;
  createdBy: string | null;
  createdAt: string;
  assignee: { username: string } | null;
};

type WorkspaceLink = {
  id: string;
  label: string;
  url: string;
  kind: "GITHUB" | "FIGMA" | "NOTION" | "DISCORD" | "DEMO" | "DOCS" | "OTHER";
  createdBy: string | null;
};

type WorkspaceActivity = {
  id: string;
  body: string;
  createdAt: string;
  actor: { username: string } | null;
};

type WorkspaceOverview = {
  currentFocus: string | null;
  milestoneTitle: string | null;
  milestoneDueAt: string | null;
  milestoneCompleted: boolean;
} | null;

type Tab = "chat" | "tasks" | "project" | "activity";

const TASK_LABELS: Record<WorkspaceTask["status"], string> = {
  TODO: "Do zrobienia",
  DOING: "W trakcie",
  DONE: "Gotowe",
};

const LINK_LABELS: Record<WorkspaceLink["kind"], string> = {
  GITHUB: "GitHub",
  FIGMA: "Figma",
  NOTION: "Notion",
  DISCORD: "Discord",
  DEMO: "Demo",
  DOCS: "Dokumentacja",
  OTHER: "Inny",
};

export function ProjectWorkspace({
  projectId,
  projectOwnerId,
  viewerId,
  members,
  workspace,
  messages,
  tasks,
  links,
  activity,
}: {
  projectId: string;
  projectOwnerId: string;
  viewerId: string;
  members: WorkspaceMember[];
  workspace: WorkspaceOverview;
  messages: WorkspaceMessage[];
  tasks: WorkspaceTask[];
  links: WorkspaceLink[];
  activity: WorkspaceActivity[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("chat");
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskAssignee, setTaskAssignee] = React.useState("");
  const [currentFocus, setCurrentFocus] = React.useState(workspace?.currentFocus ?? "");
  const [milestoneTitle, setMilestoneTitle] = React.useState(workspace?.milestoneTitle ?? "");
  const [milestoneDueAt, setMilestoneDueAt] = React.useState(workspace?.milestoneDueAt?.slice(0, 10) ?? "");
  const [milestoneCompleted, setMilestoneCompleted] = React.useState(workspace?.milestoneCompleted ?? false);
  const [linkLabel, setLinkLabel] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkKind, setLinkKind] = React.useState<WorkspaceLink["kind"]>("GITHUB");

  React.useEffect(() => {
    if (tab !== "chat") return;
    const interval = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(interval);
  }, [router, tab]);

  function run(action: () => Promise<{ success?: boolean; error?: string }>, successMessage?: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
    });
  }

  function sendMessage() {
    const body = message.trim();
    if (!body || pending) return;
    run(async () => {
      const result = await sendProjectWorkspaceMessage(projectId, body);
      if (result.success) setMessage("");
      return result;
    });
  }

  return (
    <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
      <main className="min-w-0">
        <div className="flex overflow-x-auto border-b border-[var(--bc-line)]" role="tablist" aria-label="Workspace projektu">
          <WorkspaceTab active={tab === "chat"} onClick={() => setTab("chat")}>Czat</WorkspaceTab>
          <WorkspaceTab active={tab === "tasks"} onClick={() => setTab("tasks")}>Zadania <span className="text-[var(--bc-faint)]">{tasks.filter((task) => task.status !== "DONE").length}</span></WorkspaceTab>
          <WorkspaceTab active={tab === "project"} onClick={() => setTab("project")}>Projekt</WorkspaceTab>
          <WorkspaceTab active={tab === "activity"} onClick={() => setTab("activity")}>Aktywność</WorkspaceTab>
        </div>

        {tab === "chat" ? (
          <section className="pt-5">
            <div className="mb-4 flex items-start gap-2 border-l-2 border-[var(--bc-line-strong)] pl-3 text-[12px] leading-5 text-[var(--bc-muted)]">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>Rozmowa jest widoczna tylko dla członków tego projektu. Nie wklejaj haseł, kluczy API ani danych, których zespół nie potrzebuje. <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-[var(--bc-ink)]">Prywatność</Link></p>
            </div>

            <div className="min-h-[360px] border-y border-[var(--bc-line)]">
              {messages.length ? messages.map((item) => {
                const username = item.sender?.username ?? "Builder";
                const canDelete = item.senderId === viewerId || viewerId === projectOwnerId;
                return (
                  <article key={item.id} className="group flex gap-3 border-b border-[var(--bc-line)] py-4 last:border-b-0">
                    <Avatar username={username} seed={item.senderId} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-semibold text-[var(--bc-ink)]">{username}</span>
                        <time className="text-[10px] text-[var(--bc-faint)]" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-6 text-[var(--bc-muted)]">{item.body}</p>
                    </div>
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label="Usuń wiadomość"
                        className="mt-0.5 h-8 w-8 shrink-0 rounded-[6px] text-[var(--bc-faint)] opacity-0 transition hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)] focus:opacity-100 group-hover:opacity-100"
                        onClick={() => run(() => deleteProjectWorkspaceMessage(item.id))}
                      >
                        <Trash2 className="mx-auto h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </article>
                );
              }) : (
                <div className="py-16 text-center">
                  <p className="text-[14px] font-medium text-[var(--bc-ink)]">Jeszcze nikt tu nie napisał.</p>
                  <p className="mt-1 text-[12px] text-[var(--bc-muted)]">Zacznij od ustalenia pierwszego kroku projektu.</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                maxLength={2000}
                placeholder="Napisz do zespołu…"
                className="min-h-[84px] resize-y"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] text-[var(--bc-faint)]">Ctrl/⌘ + Enter wysyła · {message.length}/2000</span>
                <Button type="button" size="sm" disabled={pending || !message.trim()} onClick={sendMessage}>
                  Wyślij <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "tasks" ? (
          <section className="pt-5">
            <div className="grid gap-3 border-b border-[var(--bc-line)] pb-5 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
              <Input value={taskTitle} maxLength={160} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Nowe zadanie, np. przygotować model danych" />
              <select className={selectClass} value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
                <option value="">Bez przypisania</option>
                {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={pending || taskTitle.trim().length < 2}
                onClick={() => run(async () => {
                  const result = await addProjectWorkspaceTask(projectId, { title: taskTitle, assigneeId: taskAssignee || undefined });
                  if (result.success) { setTaskTitle(""); setTaskAssignee(""); }
                  return result;
                }, "Dodano zadanie")}
              >
                Dodaj
              </Button>
            </div>

            <div className="divide-y divide-[var(--bc-line)]">
              {tasks.length ? tasks.map((task) => {
                const canDelete = task.createdBy === viewerId || viewerId === projectOwnerId;
                return (
                  <div key={task.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_150px_130px_36px] sm:items-center">
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium ${task.status === "DONE" ? "text-[var(--bc-faint)] line-through" : "text-[var(--bc-ink)]"}`}>{task.title}</p>
                      <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{task.assignee ? `Przypisano: ${task.assignee.username}` : "Bez przypisania"}</p>
                    </div>
                    <span className="text-[11px] text-[var(--bc-muted)]">{TASK_LABELS[task.status]}</span>
                    <select
                      aria-label={`Status zadania ${task.title}`}
                      className={`${selectClass} h-9 text-[12px]`}
                      value={task.status}
                      disabled={pending}
                      onChange={(event) => run(() => updateProjectWorkspaceTaskStatus(task.id, event.target.value as WorkspaceTask["status"]))}
                    >
                      <option value="TODO">Do zrobienia</option>
                      <option value="DOING">W trakcie</option>
                      <option value="DONE">Gotowe</option>
                    </select>
                    {canDelete ? <IconDeleteButton label="Usuń zadanie" onClick={() => run(() => deleteProjectWorkspaceTask(task.id))} /> : <span />}
                  </div>
                );
              }) : <EmptyLine title="Brak zadań" description="Dodaj tylko rzeczy, które zespół naprawdę powinien zrobić teraz." />}
            </div>
          </section>
        ) : null}

        {tab === "project" ? (
          <section className="pt-5">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <SectionHeading title="Co robimy teraz" description="Jedno zdanie, które daje zespołowi wspólny kontekst." />
                <Textarea value={currentFocus} maxLength={240} onChange={(event) => setCurrentFocus(event.target.value)} placeholder="Np. składamy pierwszy działający koszyk dla 3 sieci." className="min-h-[92px]" />
              </div>
              <div>
                <SectionHeading title="Najbliższy milestone" description="Konkretny wynik, nie lista wszystkich pomysłów." />
                <Input value={milestoneTitle} maxLength={180} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Np. MVP gotowe do testów" />
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input type="date" value={milestoneDueAt} onChange={(event) => setMilestoneDueAt(event.target.value)} />
                  <label className="flex h-10 items-center gap-2 border border-[var(--bc-line)] px-3 text-[12px] text-[var(--bc-muted)]">
                    <input type="checkbox" checked={milestoneCompleted} onChange={(event) => setMilestoneCompleted(event.target.checked)} />
                    Ukończony
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-b border-[var(--bc-line)] pb-6">
              <Button type="button" size="sm" disabled={pending} onClick={() => run(() => updateProjectWorkspaceOverview(projectId, { currentFocus, milestoneTitle, milestoneDueAt, milestoneCompleted }), "Zapisano workspace")}>Zapisz</Button>
            </div>

            <div className="pt-6">
              <SectionHeading title="Linki zespołu" description="Repo, Figma, Notion, Discord, demo albo dokumentacja — bez budowania drugiego systemu plików." />
              <div className="grid gap-2 md:grid-cols-[130px_180px_minmax(0,1fr)_auto]">
                <select className={selectClass} value={linkKind} onChange={(event) => setLinkKind(event.target.value as WorkspaceLink["kind"])}>
                  {Object.entries(LINK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Input value={linkLabel} maxLength={60} onChange={(event) => setLinkLabel(event.target.value)} placeholder="Nazwa, np. Repo" />
                <Input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" />
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || !linkLabel.trim() || !linkUrl.trim()}
                  onClick={() => run(async () => {
                    const result = await addProjectWorkspaceLink(projectId, { label: linkLabel, url: linkUrl, kind: linkKind });
                    if (result.success) { setLinkLabel(""); setLinkUrl(""); }
                    return result;
                  }, "Dodano link")}
                >
                  Dodaj
                </Button>
              </div>
              <div className="mt-4 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                {links.length ? links.map((link) => {
                  const canDelete = link.createdBy === viewerId || viewerId === projectOwnerId;
                  return (
                    <div key={link.id} className="flex items-center gap-3 py-3">
                      <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.06em] text-[var(--bc-faint)]">{LINK_LABELS[link.kind]}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--bc-ink)] hover:underline">{link.label}</a>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--bc-faint)]" />
                      {canDelete ? <IconDeleteButton label="Usuń link" onClick={() => run(() => deleteProjectWorkspaceLink(link.id))} /> : null}
                    </div>
                  );
                }) : <div className="py-6 text-[12px] text-[var(--bc-muted)]">Brak dodatkowych linków zespołu.</div>}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "activity" ? (
          <section className="pt-5">
            <SectionHeading title="Aktywność projektu" description="Krótka historia zmian w workspace. Czat nie jest kopiowany do tego feedu." />
            <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {activity.length ? activity.map((item) => (
                <div key={item.id} className="grid gap-1 py-3 sm:grid-cols-[130px_minmax(0,1fr)_140px] sm:items-baseline">
                  <span className="text-[11px] font-medium text-[var(--bc-ink)]">{item.actor?.username ?? "Członek zespołu"}</span>
                  <span className="text-[12px] text-[var(--bc-muted)]">{item.body}</span>
                  <time className="text-[10px] text-[var(--bc-faint)] sm:text-right" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                </div>
              )) : <EmptyLine title="Brak aktywności" description="Zmiany milestone'u, zadań i linków pojawią się tutaj automatycznie." />}
            </div>
          </section>
        ) : null}
      </main>

      <aside className="space-y-6">
        <section className="border-b border-[var(--bc-line)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Ekipa · {members.length}</p>
          <div className="mt-3 space-y-3">
            {members.map((member) => {
              const username = member.profile?.username ?? "Builder";
              return (
                <div key={member.userId} className="flex items-center gap-3">
                  <Avatar username={username} seed={member.userId} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[var(--bc-ink)]">{username}{member.userId === viewerId ? " · Ty" : ""}</p>
                    <p className="text-[10px] text-[var(--bc-faint)]">{member.isOwner ? "Autor" : member.roleType ? ROLE_LABELS[member.roleType] : member.profile?.role ? ROLE_LABELS[member.profile.role] : "Członek"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[var(--bc-line)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Na teraz</p>
          <p className="mt-2 text-[12px] leading-5 text-[var(--bc-ink)]">{workspace?.currentFocus || "Zespół nie ustawił jeszcze aktualnego fokusu."}</p>
        </section>

        <section className="border-b border-[var(--bc-line)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Milestone</p>
          <p className="mt-2 text-[12px] font-medium leading-5 text-[var(--bc-ink)]">{workspace?.milestoneTitle || "Brak ustawionego milestone'u"}</p>
          {workspace?.milestoneDueAt ? <p className="mt-1 text-[10px] text-[var(--bc-faint)]">Termin: {formatDate(workspace.milestoneDueAt)}</p> : null}
          {workspace?.milestoneTitle ? <p className="mt-1 text-[10px] text-[var(--bc-faint)]">{workspace.milestoneCompleted ? "Ukończony" : "W toku"}</p> : null}
        </section>
      </aside>
    </div>
  );
}

function WorkspaceTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`relative shrink-0 px-4 py-3 text-[12px] font-medium transition-colors first:pl-0 ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>
      {children}
      {active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[var(--bc-accent)] first:left-0" /> : null}
    </button>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-3"><h2 className="text-[14px] font-semibold text-[var(--bc-ink)]">{title}</h2><p className="mt-1 text-[11px] leading-5 text-[var(--bc-muted)]">{description}</p></div>;
}

function EmptyLine({ title, description }: { title: string; description: string }) {
  return <div className="py-10 text-center"><p className="text-[13px] font-medium text-[var(--bc-ink)]">{title}</p><p className="mt-1 text-[11px] text-[var(--bc-muted)]">{description}</p></div>;
}

function IconDeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className="h-8 w-8 shrink-0 rounded-[6px] text-[var(--bc-faint)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-red-600"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

const selectClass = "h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-[13px] text-[var(--bc-ink)] outline-none focus:border-[var(--bc-line-strong)] focus:ring-2 focus:ring-[var(--bc-accent-soft)]";
