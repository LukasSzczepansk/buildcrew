"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  ListPlus,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Send,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import type { ProjectWorkspaceActivityType, RoleType } from "@/db/schema";
import {
  addProjectWorkspaceLink,
  addProjectWorkspaceTask,
  deleteProjectWorkspaceLink,
  deleteProjectWorkspaceMessage,
  deleteProjectWorkspaceTask,
  editProjectWorkspaceMessage,
  markProjectWorkspaceRead,
  sendProjectWorkspaceMessage,
  setProjectWorkspaceMessagePinned,
  toggleProjectWorkspaceReaction,
  updateProjectWorkspaceOverview,
  updateProjectWorkspaceTask,
  updateProjectWorkspaceTaskStatus,
} from "@/server/actions/project-workspace";

const MAX_MESSAGE_LENGTH = 2000;

type WorkspaceMember = {
  userId: string;
  isOwner: boolean;
  roleType: RoleType | null;
  profile: { username: string; role: RoleType | null; lastActiveAt: string | null } | null;
};

type WorkspaceReaction = { reaction: "CHECK" | "LIKE"; userId: string };

type WorkspaceMessage = {
  id: string;
  senderId: string;
  body: string;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  pinnedAt: string | null;
  createdAt: string;
  sender: { username: string } | null;
  replyTo: {
    id: string;
    senderId: string;
    body: string;
    deletedAt: string | null;
    sender: { username: string } | null;
  } | null;
  reactions: WorkspaceReaction[];
};

type PinnedMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { username: string } | null;
};

type WorkspaceTask = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "DOING" | "DONE";
  assigneeId: string | null;
  dueAt: string | null;
  sourceMessageId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { username: string } | null;
};

type WorkspaceLink = {
  id: string;
  label: string;
  url: string;
  kind: "GITHUB" | "FIGMA" | "NOTION" | "DISCORD" | "DEMO" | "DOCS" | "OTHER";
  createdBy: string | null;
  createdAt: string;
};

type WorkspaceActivity = {
  id: string;
  type: ProjectWorkspaceActivityType;
  body: string;
  createdAt: string;
  actor: { username: string } | null;
};

type WorkspaceOverview = {
  currentFocus: string | null;
  milestoneTitle: string | null;
  milestoneDescription: string | null;
  milestoneDueAt: string | null;
  milestoneStatus: "PLANNED" | "DOING" | "DONE";
  milestoneCompleted: boolean;
} | null;

type Tab = "overview" | "chat" | "tasks" | "plan" | "links" | "activity";
type ActivityFilter = "ALL" | "TASKS" | "PROJECT" | "TEAM";

function workspaceLabelSets(locale: "pl" | "en") {
  return {
    tasks: locale === "en"
      ? { TODO: "To do", DOING: "In progress", DONE: "Done" } as const
      : { TODO: "Do zrobienia", DOING: "W trakcie", DONE: "Gotowe" } as const,
    milestones: locale === "en"
      ? { PLANNED: "Planned", DOING: "In progress", DONE: "Completed" } as const
      : { PLANNED: "Planowany", DOING: "W trakcie", DONE: "Ukończony" } as const,
    links: locale === "en"
      ? { GITHUB: "GitHub", FIGMA: "Figma", NOTION: "Notion", DISCORD: "Discord", DEMO: "Demo", DOCS: "Documentation", OTHER: "Other" } as const
      : { GITHUB: "GitHub", FIGMA: "Figma", NOTION: "Notion", DISCORD: "Discord", DEMO: "Demo", DOCS: "Dokumentacja", OTHER: "Inny" } as const,
  };
}

export function ProjectWorkspace({
  projectId,
  projectOwnerId,
  viewerId,
  members,
  workspace,
  messages,
  pinnedMessages,
  unreadCount,
  lastReadAt,
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
  pinnedMessages: PinnedMessage[];
  unreadCount: number;
  lastReadAt: string | null;
  tasks: WorkspaceTask[];
  links: WorkspaceLink[];
  activity: WorkspaceActivity[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const copy = useCopy();
  const workspaceLabels = workspaceLabelSets(locale);
  const isOwner = viewerId === projectOwnerId;
  const [tab, setTab] = React.useState<Tab>("overview");
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [replyTarget, setReplyTarget] = React.useState<WorkspaceMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editingMessageBody, setEditingMessageBody] = React.useState("");
  const [readAtLocal, setReadAtLocal] = React.useState(lastReadAt);
  const [localUnreadCount, setLocalUnreadCount] = React.useState(unreadCount);

  const [taskFormOpen, setTaskFormOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [taskAssignee, setTaskAssignee] = React.useState("");
  const [taskDueAt, setTaskDueAt] = React.useState("");
  const [taskSourceMessageId, setTaskSourceMessageId] = React.useState("");
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = React.useState("");
  const [editingTaskDescription, setEditingTaskDescription] = React.useState("");
  const [editingTaskAssignee, setEditingTaskAssignee] = React.useState("");
  const [editingTaskDueAt, setEditingTaskDueAt] = React.useState("");

  const [currentFocus, setCurrentFocus] = React.useState(workspace?.currentFocus ?? "");
  const [milestoneTitle, setMilestoneTitle] = React.useState(workspace?.milestoneTitle ?? "");
  const [milestoneDescription, setMilestoneDescription] = React.useState(workspace?.milestoneDescription ?? "");
  const [milestoneDueAt, setMilestoneDueAt] = React.useState(workspace?.milestoneDueAt?.slice(0, 10) ?? "");
  const [milestoneStatus, setMilestoneStatus] = React.useState<"PLANNED" | "DOING" | "DONE">(workspace?.milestoneStatus ?? "DOING");

  const [linkLabel, setLinkLabel] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkKind, setLinkKind] = React.useState<WorkspaceLink["kind"]>("GITHUB");
  const [activityFilter, setActivityFilter] = React.useState<ActivityFilter>("ALL");

  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const assignedToViewer = openTasks.filter((task) => task.assigneeId === viewerId);
  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now());
  const taskCounts = {
    TODO: tasks.filter((task) => task.status === "TODO").length,
    DOING: tasks.filter((task) => task.status === "DOING").length,
    DONE: tasks.filter((task) => task.status === "DONE").length,
  };

  React.useEffect(() => {
    if (tab !== "chat" && tab !== "overview") return;
    const interval = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(interval);
  }, [router, tab]);

  React.useEffect(() => {
    if (tab !== "chat") return;
    const now = new Date().toISOString();
    setReadAtLocal(now);
    setLocalUnreadCount(0);
    void markProjectWorkspaceRead(projectId);
  }, [projectId, tab]);

  function run(action: () => Promise<{ success?: boolean; error?: string }>, successMessage?: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(appMessage(result.error, locale));
        return;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
    });
  }

  function sendMessage() {
    const body = message.trim();
    if (!body || pending) return;
    const replyId = replyTarget?.id;
    run(async () => {
      const result = await sendProjectWorkspaceMessage(projectId, body, replyId);
      if (result.success) {
        setMessage("");
        setReplyTarget(null);
        setReadAtLocal(new Date().toISOString());
      }
      return result;
    });
  }

  function startTaskFromMessage(item: WorkspaceMessage) {
    const body = item.deletedAt ? "" : item.body.trim();
    setTaskTitle(body.slice(0, 120));
    setTaskDescription(body.length > 120 ? body : "");
    setTaskSourceMessageId(item.id);
    setTaskFormOpen(true);
    setTab("tasks");
  }

  function focusMessage(messageId: string) {
    setTab("chat");
    window.setTimeout(() => {
      document.getElementById(`workspace-message-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }

  function beginTaskEdit(task: WorkspaceTask) {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskDescription(task.description ?? "");
    setEditingTaskAssignee(task.assigneeId ?? "");
    setEditingTaskDueAt(task.dueAt?.slice(0, 10) ?? "");
  }

  const filteredActivity = activity.filter((item) => {
    if (activityFilter === "ALL") return true;
    if (activityFilter === "TASKS") return item.type.startsWith("TASK_");
    if (activityFilter === "TEAM") return item.type.startsWith("MEMBER_");
    return item.type.startsWith("FOCUS_") || item.type.startsWith("MILESTONE_") || item.type.startsWith("LINK_") || item.type.startsWith("MESSAGE_");
  });

  return (
    <div className="mt-5">
      <WorkspaceTabs
        tab={tab}
        setTab={setTab}
        unreadCount={localUnreadCount}
        openTaskCount={openTasks.length}
        linkCount={links.length}
      />

      <details className="mt-4 border-y border-[var(--bc-line)] py-3 xl:hidden">
        <summary className="cursor-pointer list-none text-[13px] font-medium text-[var(--bc-ink)]">{copy("Informacje o workspace", "Workspace information")}</summary>
        <div className="mt-4">
          <ProjectPulse
            isOwner={isOwner}
            viewerId={viewerId}
            members={members}
            workspace={workspace}
            pinnedMessages={pinnedMessages}
            links={links}
            assignedToViewer={assignedToViewer.length}
            onOpenPlan={() => setTab("plan")}
            onOpenPinned={focusMessage}
          />
        </div>
      </details>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_290px]">
        <main className="min-w-0">
          {tab === "overview" ? (
            <OverviewTab
              isOwner={isOwner}
              workspace={workspace}
              tasks={tasks}
              taskCounts={taskCounts}
              assignedToViewer={assignedToViewer}
              overdueTasks={overdueTasks}
              messages={messages}
              activity={activity}
              onOpenChat={() => setTab("chat")}
              onOpenTasks={() => setTab("tasks")}
              onOpenPlan={() => setTab("plan")}
              onFocusMessage={focusMessage}
            />
          ) : null}

          {tab === "chat" ? (
            <section className="pt-5">
              <div className="mb-4 flex items-start gap-2 border-l-2 border-[var(--bc-line-strong)] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  {copy("Rozmowa jest widoczna tylko dla członków projektu. Nie wklejaj haseł, kluczy API ani danych, których zespół nie potrzebuje. ", "This conversation is visible only to project members. Do not paste passwords, API keys or data the team does not need. ")}
                  <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-[var(--bc-ink)]">{copy("Prywatność", "Privacy")}</Link>
                </p>
              </div>

              <div className="min-h-[420px] border-y border-[var(--bc-line)]">
                {messages.length ? messages.map((item, index) => {
                  const previous = messages[index - 1];
                  const grouped = Boolean(previous && previous.senderId === item.senderId && !previous.deletedAt && !item.deletedAt && new Date(item.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60 * 1000);
                  const isFirstUnread = !grouped && isUnreadMessage(item, viewerId, readAtLocal) && !messages.slice(0, index).some((messageItem) => isUnreadMessage(messageItem, viewerId, readAtLocal));
                  return (
                    <React.Fragment key={item.id}>
                      {isFirstUnread ? (
                        <div className="flex items-center gap-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-muted)]">
                          <span className="h-px flex-1 bg-[var(--bc-line)]" />
                          {copy("Nowe wiadomości", "New messages")}
                          <span className="h-px flex-1 bg-[var(--bc-line)]" />
                        </div>
                      ) : null}
                      <MessageRow
                        item={item}
                        grouped={grouped}
                        viewerId={viewerId}
                        isOwner={isOwner}
                        pending={pending}
                        editingMessageId={editingMessageId}
                        editingMessageBody={editingMessageBody}
                        setEditingMessageId={setEditingMessageId}
                        setEditingMessageBody={setEditingMessageBody}
                        onReply={() => setReplyTarget(item)}
                        onCreateTask={() => startTaskFromMessage(item)}
                        onEdit={() => {
                          setEditingMessageId(item.id);
                          setEditingMessageBody(item.body);
                        }}
                        onSaveEdit={() => run(async () => {
                          const result = await editProjectWorkspaceMessage(item.id, editingMessageBody);
                          if (result.success) {
                            setEditingMessageId(null);
                            setEditingMessageBody("");
                          }
                          return result;
                        })}
                        onDelete={() => run(() => deleteProjectWorkspaceMessage(item.id))}
                        onPin={() => run(() => setProjectWorkspaceMessagePinned(item.id, !item.pinnedAt), item.pinnedAt ? copy("Odpięto wiadomość", "Message unpinned") : copy("Przypięto wiadomość", "Message pinned"))}
                        onReaction={(reaction) => run(() => toggleProjectWorkspaceReaction(item.id, reaction))}
                        onFocusReply={focusMessage}
                      />
                    </React.Fragment>
                  );
                }) : (
                  <EmptyLine title={copy("Jeszcze nikt tu nie napisał", "No messages yet")} description={copy("Zacznij od konkretnego ustalenia: co robicie teraz albo kto bierze pierwsze zadanie.", "Start with something concrete: what you are doing now or who takes the first task.")} />
                )}
              </div>

              <div className="sticky bottom-3 z-10 mt-4 border border-[var(--bc-line)] bg-[var(--bc-surface)] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                {replyTarget ? (
                  <div className="mb-2 flex items-start justify-between gap-3 border-b border-[var(--bc-line)] pb-2">
                    <div className="min-w-0 text-[12px] text-[var(--bc-muted)]">
                      <span className="font-medium text-[var(--bc-ink)]">{copy("Odpowiadasz", "Replying")} {replyTarget.sender?.username ? copy(`do ${replyTarget.sender.username}`, `to ${replyTarget.sender.username}`) : copy("na wiadomość", "to a message")}</span>
                      <p className="mt-0.5 truncate">{replyTarget.deletedAt ? copy("Wiadomość została usunięta.", "This message was deleted.") : replyTarget.body}</p>
                    </div>
                    <button type="button" className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]" onClick={() => setReplyTarget(null)}>{copy("Anuluj", "Cancel")}</button>
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={1}
                    placeholder={copy("Napisz do zespołu…  @nazwa oznacza członka", "Message your team…  @name mentions a member")}
                    className="min-h-11 max-h-36 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
                  />
                  <Button type="button" size="sm" disabled={pending || !message.trim()} onClick={sendMessage} className="shrink-0">
                    {copy("Wyślij", "Send")} <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--bc-faint)]">
                  <span>{copy("Ctrl/⌘ + Enter wysyła", "Ctrl/⌘ + Enter sends")}</span>
                  <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "tasks" ? (
            <section className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--bc-line)] pb-4">
                <SectionHeading title={copy("Zadania", "Tasks")} description={copy("Tylko rzeczy, które zespół faktycznie ma dowieźć. Bez rozbudowanej Jiry.", "Only work the team actually needs to ship. No heavyweight project management.")} />
                <Button type="button" size="sm" onClick={() => setTaskFormOpen((value) => !value)}>
                  <ListPlus className="h-3.5 w-3.5" /> {copy("Dodaj zadanie", "Add task")}
                </Button>
              </div>

              {taskFormOpen ? (
                <div className="grid gap-3 border-b border-[var(--bc-line)] py-4">
                  {taskSourceMessageId ? (
                    <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--bc-muted)]">
                      <span>{copy("Zadanie powstanie z wiadomości zespołu.", "This task will be linked to a team message.")}</span>
                      <button type="button" className="underline underline-offset-2" onClick={() => setTaskSourceMessageId("")}>{copy("Usuń powiązanie", "Remove link")}</button>
                    </div>
                  ) : null}
                  <Input value={taskTitle} maxLength={160} onChange={(event) => setTaskTitle(event.target.value)} placeholder={copy("Nazwa zadania, np. dokończyć importer Lidla", "Task name, e.g. finish the import flow")} />
                  <Textarea value={taskDescription} maxLength={800} onChange={(event) => setTaskDescription(event.target.value)} placeholder={copy("Krótki opis lub warunek ukończenia (opcjonalnie)", "Short description or definition of done (optional)")} className="min-h-[76px]" />
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                    <select className={selectClass} value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
                      <option value="">{copy("Nieprzypisane", "Unassigned")}</option>
                      {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
                    </select>
                    <Input type="date" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} aria-label={copy("Termin zadania", "Task due date")} />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending || taskTitle.trim().length < 2}
                      onClick={() => run(async () => {
                        const result = await addProjectWorkspaceTask(projectId, {
                          title: taskTitle,
                          description: taskDescription,
                          assigneeId: taskAssignee || undefined,
                          dueAt: taskDueAt || undefined,
                          sourceMessageId: taskSourceMessageId || undefined,
                        });
                        if (result.success) {
                          setTaskTitle("");
                          setTaskDescription("");
                          setTaskAssignee("");
                          setTaskDueAt("");
                          setTaskSourceMessageId("");
                          setTaskFormOpen(false);
                        }
                        return result;
                      }, copy("Dodano zadanie", "Task added"))}
                    >
                      {copy("Dodaj", "Add")}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                {(["TODO", "DOING", "DONE"] as const).map((status) => {
                  const statusTasks = tasks.filter((task) => task.status === status);
                  return (
                    <section key={status} className="border-b border-[var(--bc-line)] py-4 last:border-b-0">
                      <div className="mb-1 flex items-center gap-2">
                        <TaskStatusIcon status={status} />
                        <h3 className="text-[13px] font-semibold text-[var(--bc-ink)]">{workspaceLabels.tasks[status]}</h3>
                        <span className="text-[11px] text-[var(--bc-faint)]">{statusTasks.length}</span>
                      </div>
                      <div className="divide-y divide-[var(--bc-line)]">
                        {statusTasks.length ? statusTasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            viewerId={viewerId}
                            projectOwnerId={projectOwnerId}
                            members={members}
                            pending={pending}
                            editing={editingTaskId === task.id}
                            editTitle={editingTaskTitle}
                            editDescription={editingTaskDescription}
                            editAssignee={editingTaskAssignee}
                            editDueAt={editingTaskDueAt}
                            setEditTitle={setEditingTaskTitle}
                            setEditDescription={setEditingTaskDescription}
                            setEditAssignee={setEditingTaskAssignee}
                            setEditDueAt={setEditingTaskDueAt}
                            onBeginEdit={() => beginTaskEdit(task)}
                            onCancelEdit={() => setEditingTaskId(null)}
                            onSaveEdit={() => run(async () => {
                              const result = await updateProjectWorkspaceTask(task.id, {
                                title: editingTaskTitle,
                                description: editingTaskDescription,
                                assigneeId: editingTaskAssignee,
                                dueAt: editingTaskDueAt,
                              });
                              if (result.success) setEditingTaskId(null);
                              return result;
                            }, copy("Zapisano zadanie", "Task saved"))}
                            onStatus={(nextStatus) => run(() => updateProjectWorkspaceTaskStatus(task.id, nextStatus))}
                            onAssign={(assigneeId) => run(() => updateProjectWorkspaceTask(task.id, { assigneeId }))}
                            onDelete={() => run(() => deleteProjectWorkspaceTask(task.id))}
                            onSourceMessage={() => task.sourceMessageId ? focusMessage(task.sourceMessageId) : undefined}
                          />
                        )) : (
                          <p className="py-4 text-[12px] text-[var(--bc-faint)]">{copy("Brak zadań w tej sekcji.", "No tasks in this section.")}</p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          ) : null}

          {tab === "plan" ? (
            <section className="pt-5">
              <div className="border-b border-[var(--bc-line)] pb-5">
                <SectionHeading title={copy("Na teraz", "Current focus")} description={copy("Jedna rzecz, na której zespół skupia się w tej chwili.", "The one thing the team is focused on right now.")} />
                {isOwner ? (
                  <Textarea value={currentFocus} maxLength={240} onChange={(event) => setCurrentFocus(event.target.value)} placeholder={copy("Np. kończymy import cen z pierwszych 3 sieci.", "e.g. finish the first version of onboarding")} className="min-h-[82px]" />
                ) : (
                  <p className="max-w-[720px] text-[14px] leading-6 text-[var(--bc-ink)]">{workspace?.currentFocus || copy("Twórca projektu nie ustawił jeszcze aktualnego fokusu.", "The project owner has not set a current focus yet.")}</p>
                )}
              </div>

              <div className="border-b border-[var(--bc-line)] py-5">
                <SectionHeading title={copy("Najbliższy milestone", "Next milestone")} description={copy("Konkretny wynik, który zespół chce dowieźć jako następny.", "A concrete result the team wants to deliver next.")} />
                {isOwner ? (
                  <div className="grid gap-3">
                    <Input value={milestoneTitle} maxLength={180} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder={copy("Np. MVP gotowe do testów", "e.g. MVP ready for testing")} />
                    <Textarea value={milestoneDescription} maxLength={600} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder={copy("Co dokładnie oznacza ukończenie tego milestone'u?", "What exactly does completing this milestone mean?")} className="min-h-[82px]" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className={selectClass} value={milestoneStatus} onChange={(event) => setMilestoneStatus(event.target.value as "PLANNED" | "DOING" | "DONE")}>
                        {Object.entries(workspaceLabels.milestones).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <Input type="date" value={milestoneDueAt} onChange={(event) => setMilestoneDueAt(event.target.value)} />
                    </div>
                  </div>
                ) : (
                  <MilestoneReadOnly workspace={workspace} />
                )}
              </div>

              {isOwner ? (
                <div className="flex justify-end border-b border-[var(--bc-line)] py-4">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => updateProjectWorkspaceOverview(projectId, {
                      currentFocus,
                      milestoneTitle,
                      milestoneDescription,
                      milestoneDueAt,
                      milestoneStatus,
                      milestoneCompleted: milestoneStatus === "DONE",
                    }), "Zapisano plan")}
                  >
                    {copy("Zapisz plan", "Save plan")}
                  </Button>
                </div>
              ) : null}

              <div className="pt-5">
                <SectionHeading title={copy("Kolejne kroki", "Next steps")} description={copy("Otwarte zadania tworzą prosty plan pracy - bez dodatkowego systemu roadmap.", "Open tasks form a simple plan without another roadmap tool.")} />
                <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                  {openTasks.length ? openTasks.slice(0, 8).map((task) => (
                    <button key={task.id} type="button" onClick={() => setTab("tasks")} className="grid w-full gap-1 py-3 text-left sm:grid-cols-[1fr_150px_130px] sm:items-center">
                      <span className="text-[13px] font-medium text-[var(--bc-ink)]">{task.title}</span>
                      <span className="text-[12px] text-[var(--bc-muted)]">{task.assignee?.username ?? copy("Nieprzypisane", "Unassigned")}</span>
                      <span className="text-[11px] text-[var(--bc-faint)] sm:text-right">{workspaceLabels.tasks[task.status]}</span>
                    </button>
                  )) : <EmptyLine title={copy("Brak otwartych zadań", "No open tasks")} description={copy("Dodaj następne kroki w zakładce Zadania.", "Add next steps in the Tasks tab.")} />}
                </div>
              </div>
            </section>
          ) : null}

          {tab === "links" ? (
            <section className="pt-5">
              <SectionHeading title={copy("Linki zespołu", "Team links")} description={copy("Repo, Figma, Notion, Discord, demo i dokumentacja w jednym miejscu. Pliki zostają w narzędziach, które już ich pilnują.", "Keep repositories, Figma, Notion, Discord, demos and docs in one place while files stay in the tools that own them.")} />
              <div className="grid gap-2 border-b border-[var(--bc-line)] pb-5 md:grid-cols-[130px_180px_minmax(0,1fr)_auto]">
                <select className={selectClass} value={linkKind} onChange={(event) => setLinkKind(event.target.value as WorkspaceLink["kind"])}>
                  {Object.entries(workspaceLabels.links).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Input value={linkLabel} maxLength={60} onChange={(event) => setLinkLabel(event.target.value)} placeholder={copy("Nazwa, np. Repo", "Name, e.g. Repository")} />
                <Input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" />
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || !linkLabel.trim() || !linkUrl.trim()}
                  onClick={() => run(async () => {
                    const result = await addProjectWorkspaceLink(projectId, { label: linkLabel, url: linkUrl, kind: linkKind });
                    if (result.success) {
                      setLinkLabel("");
                      setLinkUrl("");
                    }
                    return result;
                  }, copy("Dodano link", "Link added"))}
                >
                  {copy("Dodaj", "Add")}
                </Button>
              </div>
              <div className="divide-y divide-[var(--bc-line)] border-b border-[var(--bc-line)]">
                {links.length ? links.map((link) => {
                  const canDelete = link.createdBy === viewerId || isOwner;
                  return (
                    <div key={link.id} className="grid gap-2 py-3 sm:grid-cols-[120px_minmax(0,1fr)_150px_auto] sm:items-center">
                      <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--bc-faint)]">{workspaceLabels.links[link.kind]}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-sm font-medium text-[var(--bc-ink)] hover:underline">{link.label}</a>
                      <span className="text-[11px] text-[var(--bc-faint)]">{copy("Dodano", "Added")} {formatDate(link.createdAt, locale)}</span>
                      <div className="flex items-center justify-end gap-1">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={copy(`Otwórz ${link.label}`, `Open ${link.label}`)} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><ExternalLink className="h-3.5 w-3.5" /></a>
                        {canDelete ? <IconDeleteButton label={copy("Usuń link", "Delete link")} onClick={() => run(() => deleteProjectWorkspaceLink(link.id))} /> : null}
                      </div>
                    </div>
                  );
                }) : <EmptyLine title={copy("Brak linków zespołu", "No team links")} description={copy("Dodaj tylko rzeczy, do których zespół naprawdę wraca podczas pracy.", "Add only links the team actually uses while working.")} />}
              </div>
            </section>
          ) : null}

          {tab === "activity" ? (
            <section className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--bc-line)] pb-4">
                <SectionHeading title={copy("Aktywność projektu", "Project activity")} description={copy("Historia ważnych zmian: plan, zadania, linki i zespół. Treść czatu nie jest tutaj kopiowana.", "A history of important changes to the plan, tasks, links and team. Chat content is not copied here.")} />
                <div className="flex flex-wrap gap-1">
                  {(["ALL", "TASKS", "PROJECT", "TEAM"] as ActivityFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActivityFilter(filter)}
                      className={`rounded-[5px] px-2.5 py-1.5 text-[12px] ${activityFilter === filter ? "bg-[var(--bc-surface-subtle)] font-medium text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}
                    >
                      {filter === "ALL" ? copy("Wszystko", "All") : filter === "TASKS" ? copy("Zadania", "Tasks") : filter === "TEAM" ? copy("Zespół", "Team") : copy("Projekt", "Project")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[var(--bc-line)]">
                {filteredActivity.length ? filteredActivity.map((item) => (
                  <div key={item.id} className="grid gap-1 py-3 sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:items-baseline">
                    <span className="text-[12px] font-medium text-[var(--bc-ink)]">{item.actor?.username ?? "BuildCrew"}</span>
                    <span className="text-[13px] text-[var(--bc-muted)]">{item.body}</span>
                    <time className="text-[11px] text-[var(--bc-faint)] sm:text-right" dateTime={item.createdAt}>{formatDateTime(item.createdAt, locale)}</time>
                  </div>
                )) : <EmptyLine title={copy("Brak aktywności", "No activity yet")} description={copy("Zmiany pojawią się tutaj automatycznie.", "Changes will appear here automatically.")} />}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-20 border-l border-[var(--bc-line)] pl-6 pt-5">
            <ProjectPulse
              isOwner={isOwner}
              viewerId={viewerId}
              members={members}
              workspace={workspace}
              pinnedMessages={pinnedMessages}
              links={links}
              assignedToViewer={assignedToViewer.length}
              onOpenPlan={() => setTab("plan")}
              onOpenPinned={focusMessage}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function WorkspaceTabs({
  tab,
  setTab,
  unreadCount,
  openTaskCount,
  linkCount,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  unreadCount: number;
  openTaskCount: number;
  linkCount: number;
}) {
  const copy = useCopy();
  const items: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: copy("Przegląd", "Overview") },
    { key: "chat", label: copy("Rozmowa", "Chat"), count: unreadCount },
    { key: "tasks", label: copy("Zadania", "Tasks"), count: openTaskCount },
    { key: "plan", label: copy("Plan", "Plan") },
    { key: "links", label: copy("Linki", "Links"), count: linkCount },
    { key: "activity", label: copy("Aktywność", "Activity") },
  ];
  return (
    <div className="flex overflow-x-auto border-b border-[var(--bc-line)]" role="tablist" aria-label={copy("Workspace projektu", "Project workspace")}>
      {items.map((item) => (
        <WorkspaceTab key={item.key} active={tab === item.key} onClick={() => setTab(item.key)}>
          {item.label}{item.count ? <span className="ml-1.5 text-[11px] text-[var(--bc-faint)]">{item.count}</span> : null}
        </WorkspaceTab>
      ))}
    </div>
  );
}

function OverviewTab({
  isOwner,
  workspace,
  tasks,
  taskCounts,
  assignedToViewer,
  overdueTasks,
  messages,
  activity,
  onOpenChat,
  onOpenTasks,
  onOpenPlan,
  onFocusMessage,
}: {
  isOwner: boolean;
  workspace: WorkspaceOverview;
  tasks: WorkspaceTask[];
  taskCounts: { TODO: number; DOING: number; DONE: number };
  assignedToViewer: WorkspaceTask[];
  overdueTasks: WorkspaceTask[];
  messages: WorkspaceMessage[];
  activity: WorkspaceActivity[];
  onOpenChat: () => void;
  onOpenTasks: () => void;
  onOpenPlan: () => void;
  onFocusMessage: (id: string) => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const workspaceLabels = workspaceLabelSets(locale);
  const latestMessages = messages.filter((message) => !message.deletedAt).slice(-3).reverse();
  return (
    <section className="pt-5">
      <div className="grid border-y border-[var(--bc-line)] md:grid-cols-2">
        <div className="border-b border-[var(--bc-line)] py-5 md:border-b-0 md:border-r md:pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Na teraz", "Current focus")}</p>
          <p className="mt-2 max-w-[620px] text-[15px] font-medium leading-6 text-[var(--bc-ink)]">{workspace?.currentFocus || copy("Brak ustawionego fokusu.", "No current focus set.")}</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="mt-3 text-[12px] font-medium text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">{workspace?.currentFocus ? copy("Edytuj fokus", "Edit focus") : copy("Ustaw fokus", "Set focus")}</button> : null}
        </div>
        <div className="py-5 md:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Najbliższy milestone", "Next milestone")}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium leading-5 text-[var(--bc-ink)]">{workspace?.milestoneTitle || copy("Brak ustawionego milestone'u", "No milestone set")}</p>
              {workspace?.milestoneDueAt ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{formatDate(workspace.milestoneDueAt, locale)} · {workspaceLabels.milestones[workspace.milestoneStatus]}</p> : workspace?.milestoneTitle ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{workspaceLabels.milestones[workspace.milestoneStatus]}</p> : null}
            </div>
            {workspace?.milestoneStatus === "DONE" ? <CheckCircle2 className="h-4 w-4 text-[var(--bc-accent-strong)]" /> : null}
          </div>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="mt-3 text-[12px] font-medium text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">{workspace?.milestoneTitle ? copy("Edytuj milestone", "Edit milestone") : copy("Ustaw milestone", "Set milestone")}</button> : null}
        </div>
      </div>

      <div className="grid border-b border-[var(--bc-line)] md:grid-cols-[1fr_1fr]">
        <div className="border-b border-[var(--bc-line)] py-5 md:border-b-0 md:border-r md:pr-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title={copy("Zadania", "Tasks")} description={copy("Stan pracy zespołu.", "Team work status.")} />
            <button type="button" onClick={onOpenTasks} className="text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{copy("Otwórz", "Open")} →</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label={copy("Do zrobienia", "To do")} value={taskCounts.TODO} />
            <Metric label={copy("W trakcie", "In progress")} value={taskCounts.DOING} />
            <Metric label={copy("Gotowe", "Done")} value={taskCounts.DONE} />
          </div>
          {assignedToViewer.length ? <p className="mt-4 text-[12px] text-[var(--bc-muted)]">{copy("Przypisane Tobie:", "Assigned to you:")} <strong className="font-medium text-[var(--bc-ink)]">{assignedToViewer.length}</strong></p> : null}
          {overdueTasks.length ? <p className="mt-1 text-[12px] text-red-700 dark:text-red-400">{copy("Po terminie:", "Overdue:")} {overdueTasks.length}</p> : null}
          {!tasks.length ? <p className="mt-4 text-[12px] text-[var(--bc-faint)]">{copy("Nie dodano jeszcze zadań.", "No tasks have been added yet.")}</p> : null}
        </div>

        <div className="py-5 md:pl-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title={copy("Ostatnia rozmowa", "Latest conversation")} description={copy("Najnowsze ustalenia zespołu.", "The team's latest discussion.")} />
            <button type="button" onClick={onOpenChat} className="text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{copy("Rozmowa", "Chat")} →</button>
          </div>
          <div className="divide-y divide-[var(--bc-line)]">
            {latestMessages.length ? latestMessages.map((message) => (
              <button key={message.id} type="button" onClick={() => onFocusMessage(message.id)} className="grid w-full gap-1 py-2.5 text-left sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="truncate text-[11px] font-medium text-[var(--bc-ink)]">{message.sender?.username ?? "Builder"}</span>
                <span className="truncate text-[12px] text-[var(--bc-muted)]">{message.body}</span>
              </button>
            )) : <p className="py-4 text-[12px] text-[var(--bc-faint)]">{copy("Brak wiadomości.", "No messages.")}</p>}
          </div>
        </div>
      </div>

      <div className="py-5">
        <SectionHeading title={copy("Ostatnia aktywność", "Latest activity")} description={copy("Najważniejsze zmiany poza rozmową.", "Important changes outside the conversation.")} />
        <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
          {activity.length ? activity.slice(0, 5).map((item) => (
            <div key={item.id} className="grid gap-1 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:items-baseline">
              <span className="text-[11px] font-medium text-[var(--bc-ink)]">{item.actor?.username ?? "BuildCrew"}</span>
              <span className="text-[12px] text-[var(--bc-muted)]">{item.body}</span>
              <time className="text-[11px] text-[var(--bc-faint)] sm:text-right">{formatDateTime(item.createdAt, locale)}</time>
            </div>
          )) : <p className="py-5 text-[12px] text-[var(--bc-faint)]">{copy("Aktywność pojawi się po pierwszych zmianach w workspace.", "Activity will appear after the first workspace changes.")}</p>}
        </div>
      </div>
    </section>
  );
}

function MessageRow({
  item,
  grouped,
  viewerId,
  isOwner,
  pending,
  editingMessageId,
  editingMessageBody,
  setEditingMessageId,
  setEditingMessageBody,
  onReply,
  onCreateTask,
  onEdit,
  onSaveEdit,
  onDelete,
  onPin,
  onReaction,
  onFocusReply,
}: {
  item: WorkspaceMessage;
  grouped: boolean;
  viewerId: string;
  isOwner: boolean;
  pending: boolean;
  editingMessageId: string | null;
  editingMessageBody: string;
  setEditingMessageId: (value: string | null) => void;
  setEditingMessageBody: (value: string) => void;
  onReply: () => void;
  onCreateTask: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReaction: (reaction: "CHECK" | "LIKE") => void;
  onFocusReply: (id: string) => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const username = item.sender?.username ?? "Builder";
  const canEdit = item.senderId === viewerId && !item.deletedAt;
  const canDelete = (item.senderId === viewerId || isOwner) && !item.deletedAt;
  const checkUsers = item.reactions.filter((reaction) => reaction.reaction === "CHECK");
  const likeUsers = item.reactions.filter((reaction) => reaction.reaction === "LIKE");
  const checkedByViewer = checkUsers.some((reaction) => reaction.userId === viewerId);
  const likedByViewer = likeUsers.some((reaction) => reaction.userId === viewerId);

  return (
    <article id={`workspace-message-${item.id}`} className={`group grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-1 ${grouped ? "py-1.5" : "pt-4 pb-1.5"}`}>
      <div>{grouped ? null : <Avatar username={username} seed={item.senderId} size="sm" />}</div>
      <div className="min-w-0">
        {!grouped ? (
          <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-[var(--bc-ink)]">{username}</span>
            <time className="text-[11px] text-[var(--bc-faint)]" dateTime={item.createdAt}>{formatDateTime(item.createdAt, locale)}</time>
            {item.editedAt && !item.deletedAt ? <span className="text-[11px] text-[var(--bc-faint)]">{copy("edytowano", "edited")}</span> : null}
            {item.pinnedAt ? <Pin className="h-3 w-3 text-[var(--bc-muted)]" aria-label={copy("Przypięta wiadomość", "Pinned message")} /> : null}
          </div>
        ) : null}

        {item.replyTo ? (
          <button type="button" onClick={() => onFocusReply(item.replyTo!.id)} className="mb-1.5 mt-1 block max-w-full border-l-2 border-[var(--bc-line-strong)] pl-2 text-left text-[11px] leading-4 text-[var(--bc-faint)] hover:text-[var(--bc-muted)]">
            <span className="font-medium">{item.replyTo.sender?.username ?? "Builder"}</span>
            <span className="ml-1 line-clamp-1">{item.replyTo.body}</span>
          </button>
        ) : null}

        {editingMessageId === item.id ? (
          <div className="mt-1">
            <Textarea value={editingMessageBody} maxLength={MAX_MESSAGE_LENGTH} onChange={(event) => setEditingMessageBody(event.target.value)} className="min-h-[72px]" />
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" disabled={pending || !editingMessageBody.trim()} onClick={onSaveEdit}>{copy("Zapisz", "Save")}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingMessageId(null); setEditingMessageBody(""); }}>{copy("Anuluj", "Cancel")}</Button>
            </div>
          </div>
        ) : item.deletedAt ? (
          <p className="mt-0.5 text-[13px] italic leading-5 text-[var(--bc-faint)]">{copy("Wiadomość została usunięta.", "This message was deleted.")}</p>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--bc-ink)]">{renderMentions(item.body)}</p>
        )}

        {!item.deletedAt && editingMessageId !== item.id ? (
          <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1">
            {checkUsers.length ? <ReactionButton active={checkedByViewer} label={copy("Potwierdzone", "Confirmed")} count={checkUsers.length} icon={<Check className="h-3 w-3" />} onClick={() => onReaction("CHECK")} /> : null}
            {likeUsers.length ? <ReactionButton active={likedByViewer} label={copy("Lubię", "Like")} count={likeUsers.length} icon={<ThumbsUp className="h-3 w-3" />} onClick={() => onReaction("LIKE")} /> : null}

            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {!checkUsers.length ? <MiniAction label={copy("Potwierdź", "Confirm")} onClick={() => onReaction("CHECK")}><Check className="h-3 w-3" /></MiniAction> : null}
              {!likeUsers.length ? <MiniAction label={copy("Lubię", "Like")} onClick={() => onReaction("LIKE")}><ThumbsUp className="h-3 w-3" /></MiniAction> : null}
              <MiniAction label={copy("Odpowiedz", "Reply")} onClick={onReply}><Reply className="h-3 w-3" /></MiniAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={copy("Więcej akcji", "More actions")} className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={onCreateTask}><ListPlus className="h-3.5 w-3.5" /> {copy("Utwórz zadanie", "Create task")}</DropdownMenuItem>
                  {isOwner ? <DropdownMenuItem onSelect={onPin}>{item.pinnedAt ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />} {item.pinnedAt ? copy("Odepnij", "Unpin") : copy("Przypnij", "Pin")}</DropdownMenuItem> : null}
                  {canEdit ? <DropdownMenuItem onSelect={onEdit}><Pencil className="h-3.5 w-3.5" /> {copy("Edytuj", "Edit")}</DropdownMenuItem> : null}
                  {canDelete ? <DropdownMenuSeparator /> : null}
                  {canDelete ? <DropdownMenuItem onSelect={onDelete} className="text-red-700 focus:text-red-700 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /> {copy("Usuń", "Delete")}</DropdownMenuItem> : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TaskRow({
  task,
  viewerId,
  projectOwnerId,
  members,
  pending,
  editing,
  editTitle,
  editDescription,
  editAssignee,
  editDueAt,
  setEditTitle,
  setEditDescription,
  setEditAssignee,
  setEditDueAt,
  onBeginEdit,
  onCancelEdit,
  onSaveEdit,
  onStatus,
  onAssign,
  onDelete,
  onSourceMessage,
}: {
  task: WorkspaceTask;
  viewerId: string;
  projectOwnerId: string;
  members: WorkspaceMember[];
  pending: boolean;
  editing: boolean;
  editTitle: string;
  editDescription: string;
  editAssignee: string;
  editDueAt: string;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;
  setEditAssignee: (value: string) => void;
  setEditDueAt: (value: string) => void;
  onBeginEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStatus: (status: WorkspaceTask["status"]) => void;
  onAssign: (assigneeId: string) => void;
  onDelete: () => void;
  onSourceMessage: () => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const workspaceLabels = workspaceLabelSets(locale);
  const canDelete = task.createdBy === viewerId || projectOwnerId === viewerId;
  const overdue = Boolean(task.dueAt && task.status !== "DONE" && new Date(task.dueAt).getTime() < Date.now());
  if (editing) {
    return (
      <div className="grid gap-2 py-3">
        <Input value={editTitle} maxLength={160} onChange={(event) => setEditTitle(event.target.value)} />
        <Textarea value={editDescription} maxLength={800} onChange={(event) => setEditDescription(event.target.value)} placeholder={copy("Opis zadania", "Task description")} className="min-h-[72px]" />
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={selectClass} value={editAssignee} onChange={(event) => setEditAssignee(event.target.value)}>
            <option value="">{copy("Nieprzypisane", "Unassigned")}</option>
            {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
          </select>
          <Input type="date" value={editDueAt} onChange={(event) => setEditDueAt(event.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={pending || editTitle.trim().length < 2} onClick={onSaveEdit}>{copy("Zapisz", "Save")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>{copy("Anuluj", "Cancel")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 py-3 lg:grid-cols-[minmax(0,1fr)_150px_145px_auto] lg:items-center">
      <div className="min-w-0">
        <button type="button" onClick={onBeginEdit} className="max-w-full text-left text-[13px] font-medium text-[var(--bc-ink)] hover:underline">{task.title}</button>
        {task.description ? <p className="mt-1 line-clamp-2 max-w-[680px] text-[12px] leading-5 text-[var(--bc-muted)]">{task.description}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--bc-faint)]">
          {task.dueAt ? <span className={overdue ? "text-red-700 dark:text-red-400" : ""}>{copy("Termin:", "Due:")} {formatDate(task.dueAt, locale)}{overdue ? copy(" · po terminie", " · overdue") : ""}</span> : null}
          {task.sourceMessageId ? <button type="button" onClick={onSourceMessage} className="underline underline-offset-2">{copy("Z rozmowy", "From chat")} →</button> : null}
        </div>
      </div>
      <select className={`${selectClass} h-9 text-[12px]`} value={task.assigneeId ?? ""} onChange={(event) => onAssign(event.target.value)}>
        <option value="">{copy("Nieprzypisane", "Unassigned")}</option>
        {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
      </select>
      <select className={`${selectClass} h-9 text-[12px]`} value={task.status} onChange={(event) => onStatus(event.target.value as WorkspaceTask["status"])}>
        {Object.entries(workspaceLabels.tasks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="flex items-center justify-end gap-1">
        {!task.assigneeId ? <button type="button" onClick={() => onAssign(viewerId)} className="mr-1 text-[11px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{copy("Przypisz mnie", "Assign me")}</button> : null}
        <button type="button" aria-label={copy("Edytuj zadanie", "Edit task")} onClick={onBeginEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><Pencil className="h-3.5 w-3.5" /></button>
        {canDelete ? <IconDeleteButton label={copy("Usuń zadanie", "Delete task")} onClick={onDelete} /> : null}
      </div>
    </div>
  );
}

function ProjectPulse({
  isOwner,
  viewerId,
  members,
  workspace,
  pinnedMessages,
  links,
  assignedToViewer,
  onOpenPlan,
  onOpenPinned,
}: {
  isOwner: boolean;
  viewerId: string;
  members: WorkspaceMember[];
  workspace: WorkspaceOverview;
  pinnedMessages: PinnedMessage[];
  links: WorkspaceLink[];
  assignedToViewer: number;
  onOpenPlan: () => void;
  onOpenPinned: (id: string) => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const labels = labelsFor(locale);
  const workspaceLabels = workspaceLabelSets(locale);
  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Zespół", "Team")} · {members.length}</p>
          {assignedToViewer ? <span className="text-[11px] text-[var(--bc-muted)]">{assignedToViewer} {copy("dla Ciebie", "for you")}</span> : null}
        </div>
        <div className="mt-3 divide-y divide-[var(--bc-line)]">
          {members.map((member) => {
            const username = member.profile?.username ?? "Builder";
            return (
              <Link key={member.userId} href={`/builders/${member.userId}`} className="flex items-center gap-3 py-2 first:pt-0 hover:bg-[var(--bc-surface-subtle)]">
                <Avatar username={username} seed={member.userId} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--bc-ink)]">{username}{member.userId === viewerId ? copy(" · Ty", " · You") : ""}</p>
                  <p className="text-[11px] text-[var(--bc-faint)]">{member.isOwner ? copy("Autor", "Owner") : member.roleType ? labels.roles[member.roleType] : member.profile?.role ? labels.roles[member.profile.role] : copy("Członek", "Member")}</p>
                </div>
                <span className="text-[11px] text-[var(--bc-faint)]">{activityLabel(member.profile?.lastActiveAt ?? null, locale)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Na teraz", "Current focus")}</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="text-[11px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{copy("Edytuj", "Edit")}</button> : null}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-[var(--bc-ink)]">{workspace?.currentFocus || copy("Brak ustawionego fokusu.", "No current focus set.")}</p>
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Milestone</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="text-[11px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{copy("Edytuj", "Edit")}</button> : null}
        </div>
        <p className="mt-2 text-[13px] font-medium leading-5 text-[var(--bc-ink)]">{workspace?.milestoneTitle || copy("Brak ustawionego milestone'u", "No milestone set")}</p>
        {workspace?.milestoneDueAt ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{formatDate(workspace.milestoneDueAt, locale)}</p> : null}
        {workspace?.milestoneTitle ? <span className="mt-2 inline-flex rounded-[4px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--bc-muted)]">{workspaceLabels.milestones[workspace.milestoneStatus]}</span> : null}
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Przypięte", "Pinned")} · {pinnedMessages.length}</p>
        <div className="mt-2 divide-y divide-[var(--bc-line)]">
          {pinnedMessages.length ? pinnedMessages.slice(0, 4).map((item) => (
            <button key={item.id} type="button" onClick={() => onOpenPinned(item.id)} className="w-full py-2 text-left">
              <p className="line-clamp-2 text-[12px] leading-4 text-[var(--bc-ink)]">{item.body}</p>
              <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{item.sender?.username ?? "Builder"} · {formatDate(item.createdAt, locale)}</p>
            </button>
          )) : <p className="py-2 text-[11px] text-[var(--bc-faint)]">{copy("Brak przypiętych ustaleń.", "No pinned messages.")}</p>}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Linki", "Links")} · {links.length}</p>
        <div className="mt-2 space-y-1.5">
          {links.length ? links.slice(0, 4).map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 py-1 text-[12px] text-[var(--bc-ink)] hover:underline">
              <span className="truncate">{link.label}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-[var(--bc-faint)]" />
            </a>
          )) : <p className="py-1 text-[11px] text-[var(--bc-faint)]">{copy("Brak linków projektu.", "No project links.")}</p>}
        </div>
      </section>
    </div>
  );
}

function MilestoneReadOnly({ workspace }: { workspace: WorkspaceOverview }) {
  const copy = useCopy();
  const locale = useLocale();
  const workspaceLabels = workspaceLabelSets(locale);
  if (!workspace?.milestoneTitle) return <p className="text-[13px] text-[var(--bc-muted)]">{copy("Brak ustawionego milestone'u.", "No milestone set.")}</p>;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[15px] font-medium text-[var(--bc-ink)]">{workspace.milestoneTitle}</p>
        <span className="rounded-[4px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--bc-muted)]">{workspaceLabels.milestones[workspace.milestoneStatus]}</span>
      </div>
      {workspace.milestoneDescription ? <p className="mt-2 max-w-[720px] text-sm leading-6 text-[var(--bc-muted)]">{workspace.milestoneDescription}</p> : null}
      {workspace.milestoneDueAt ? <p className="mt-2 text-[12px] text-[var(--bc-faint)]">{copy("Termin:", "Due:")} {formatDate(workspace.milestoneDueAt, locale)}</p> : null}
    </div>
  );
}

function WorkspaceTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`relative shrink-0 px-4 py-3 text-[13px] font-medium transition-colors first:pl-0 ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>
      {children}
      {active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[var(--bc-accent)] first:left-0" /> : null}
    </button>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-3"><h2 className="text-[14px] font-semibold text-[var(--bc-ink)]">{title}</h2><p className="mt-1 text-[12px] leading-5 text-[var(--bc-muted)]">{description}</p></div>;
}

function EmptyLine({ title, description }: { title: string; description: string }) {
  return <div className="py-10 text-center"><p className="text-sm font-medium text-[var(--bc-ink)]">{title}</p><p className="mt-1 text-[12px] text-[var(--bc-muted)]">{description}</p></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">{value}</p><p className="mt-0.5 text-[11px] text-[var(--bc-faint)]">{label}</p></div>;
}

function TaskStatusIcon({ status }: { status: WorkspaceTask["status"] }) {
  if (status === "DONE") return <CheckCircle2 className="h-3.5 w-3.5 text-[var(--bc-muted)]" />;
  if (status === "DOING") return <Clock3 className="h-3.5 w-3.5 text-[var(--bc-muted)]" />;
  return <Circle className="h-3.5 w-3.5 text-[var(--bc-faint)]" />;
}

function MiniAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]">{children}</button>;
}

function ReactionButton({ active, label, count, icon, onClick }: { active: boolean; label: string; count: number; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className={`inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[11px] ${active ? "border-[color-mix(in_srgb,var(--bc-accent)_55%,var(--bc-line))] bg-[color-mix(in_srgb,var(--bc-accent)_12%,var(--bc-surface))] text-[var(--bc-ink)]" : "border-[var(--bc-line)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)]"}`}>{icon}{count}</button>;
}

function IconDeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--bc-faint)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>;
}

function renderMentions(body: string) {
  const parts = body.split(/(@[\p{L}\p{N}._-]{2,24})/gu);
  return parts.map((part, index) => part.startsWith("@") ? <span key={`${part}-${index}`} className="font-medium text-[var(--bc-ink)] underline decoration-[color-mix(in_srgb,var(--bc-accent)_60%,transparent)] decoration-2 underline-offset-2">{part}</span> : <React.Fragment key={index}>{part}</React.Fragment>);
}

function isUnreadMessage(item: WorkspaceMessage, viewerId: string, lastReadAt: string | null) {
  if (item.senderId === viewerId || item.deletedAt) return false;
  if (!lastReadAt) return true;
  return new Date(item.createdAt).getTime() > new Date(lastReadAt).getTime();
}

function formatDateTime(value: string, locale: "pl" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string, locale: "pl" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function activityLabel(value: string | null, locale: "pl" | "en") {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 24 * 60 * 60 * 1000) return locale === "en" ? "today" : "dziś";
  if (diff < 7 * 24 * 60 * 60 * 1000) return locale === "en" ? "this week" : "ten tydz.";
  return "";
}

const selectClass = "h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm text-[var(--bc-ink)] outline-none focus:border-[var(--bc-line-strong)] focus:ring-2 focus:ring-[var(--bc-accent-soft)]";
