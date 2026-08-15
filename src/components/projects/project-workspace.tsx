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
import { ROLE_LABELS } from "@/lib/constants";
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

const TASK_LABELS: Record<WorkspaceTask["status"], string> = {
  TODO: "Do zrobienia",
  DOING: "W trakcie",
  DONE: "Gotowe",
};

const MILESTONE_LABELS: Record<"PLANNED" | "DOING" | "DONE", string> = {
  PLANNED: "Planowany",
  DOING: "W trakcie",
  DONE: "Ukończony",
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
        <summary className="cursor-pointer list-none text-[13px] font-medium text-[var(--bc-ink)]">Informacje o workspace</summary>
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
                  Rozmowa jest widoczna tylko dla członków projektu. Nie wklejaj haseł, kluczy API ani danych, których zespół nie potrzebuje. {" "}
                  <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-[var(--bc-ink)]">Prywatność</Link>
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
                          Nowe wiadomości
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
                        onPin={() => run(() => setProjectWorkspaceMessagePinned(item.id, !item.pinnedAt), item.pinnedAt ? "Odpięto wiadomość" : "Przypięto wiadomość")}
                        onReaction={(reaction) => run(() => toggleProjectWorkspaceReaction(item.id, reaction))}
                        onFocusReply={focusMessage}
                      />
                    </React.Fragment>
                  );
                }) : (
                  <EmptyLine title="Jeszcze nikt tu nie napisał" description="Zacznij od konkretnego ustalenia: co robicie teraz albo kto bierze pierwsze zadanie." />
                )}
              </div>

              <div className="sticky bottom-3 z-10 mt-4 border border-[var(--bc-line)] bg-[var(--bc-surface)] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                {replyTarget ? (
                  <div className="mb-2 flex items-start justify-between gap-3 border-b border-[var(--bc-line)] pb-2">
                    <div className="min-w-0 text-[12px] text-[var(--bc-muted)]">
                      <span className="font-medium text-[var(--bc-ink)]">Odpowiadasz {replyTarget.sender?.username ? `do ${replyTarget.sender.username}` : "na wiadomość"}</span>
                      <p className="mt-0.5 truncate">{replyTarget.deletedAt ? "Wiadomość została usunięta." : replyTarget.body}</p>
                    </div>
                    <button type="button" className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]" onClick={() => setReplyTarget(null)}>Anuluj</button>
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
                    placeholder="Napisz do zespołu…  @nazwa oznacza członka"
                    className="min-h-11 max-h-36 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
                  />
                  <Button type="button" size="sm" disabled={pending || !message.trim()} onClick={sendMessage} className="shrink-0">
                    Wyślij <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--bc-faint)]">
                  <span>Ctrl/⌘ + Enter wysyła</span>
                  <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "tasks" ? (
            <section className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--bc-line)] pb-4">
                <SectionHeading title="Zadania" description="Tylko rzeczy, które zespół faktycznie ma dowieźć. Bez rozbudowanej Jiry." />
                <Button type="button" size="sm" onClick={() => setTaskFormOpen((value) => !value)}>
                  <ListPlus className="h-3.5 w-3.5" /> Dodaj zadanie
                </Button>
              </div>

              {taskFormOpen ? (
                <div className="grid gap-3 border-b border-[var(--bc-line)] py-4">
                  {taskSourceMessageId ? (
                    <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--bc-muted)]">
                      <span>Zadanie powstanie z wiadomości zespołu.</span>
                      <button type="button" className="underline underline-offset-2" onClick={() => setTaskSourceMessageId("")}>Usuń powiązanie</button>
                    </div>
                  ) : null}
                  <Input value={taskTitle} maxLength={160} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Nazwa zadania, np. dokończyć importer Lidla" />
                  <Textarea value={taskDescription} maxLength={800} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Krótki opis lub warunek ukończenia (opcjonalnie)" className="min-h-[76px]" />
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                    <select className={selectClass} value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
                      <option value="">Nieprzypisane</option>
                      {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
                    </select>
                    <Input type="date" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} aria-label="Termin zadania" />
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
                      }, "Dodano zadanie")}
                    >
                      Dodaj
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
                        <h3 className="text-[13px] font-semibold text-[var(--bc-ink)]">{TASK_LABELS[status]}</h3>
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
                            }, "Zapisano zadanie")}
                            onStatus={(nextStatus) => run(() => updateProjectWorkspaceTaskStatus(task.id, nextStatus))}
                            onAssign={(assigneeId) => run(() => updateProjectWorkspaceTask(task.id, { assigneeId }))}
                            onDelete={() => run(() => deleteProjectWorkspaceTask(task.id))}
                            onSourceMessage={() => task.sourceMessageId ? focusMessage(task.sourceMessageId) : undefined}
                          />
                        )) : (
                          <p className="py-4 text-[12px] text-[var(--bc-faint)]">Brak zadań w tej sekcji.</p>
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
                <SectionHeading title="Na teraz" description="Jedna rzecz, na której zespół skupia się w tej chwili." />
                {isOwner ? (
                  <Textarea value={currentFocus} maxLength={240} onChange={(event) => setCurrentFocus(event.target.value)} placeholder="Np. kończymy import cen z pierwszych 3 sieci." className="min-h-[82px]" />
                ) : (
                  <p className="max-w-[720px] text-[14px] leading-6 text-[var(--bc-ink)]">{workspace?.currentFocus || "Twórca projektu nie ustawił jeszcze aktualnego fokusu."}</p>
                )}
              </div>

              <div className="border-b border-[var(--bc-line)] py-5">
                <SectionHeading title="Najbliższy milestone" description="Konkretny wynik, który zespół chce dowieźć jako następny." />
                {isOwner ? (
                  <div className="grid gap-3">
                    <Input value={milestoneTitle} maxLength={180} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Np. MVP gotowe do testów" />
                    <Textarea value={milestoneDescription} maxLength={600} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder="Co dokładnie oznacza ukończenie tego milestone'u?" className="min-h-[82px]" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className={selectClass} value={milestoneStatus} onChange={(event) => setMilestoneStatus(event.target.value as "PLANNED" | "DOING" | "DONE")}>
                        {Object.entries(MILESTONE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
                    Zapisz plan
                  </Button>
                </div>
              ) : null}

              <div className="pt-5">
                <SectionHeading title="Kolejne kroki" description="Otwarte zadania tworzą prosty plan pracy — bez dodatkowego systemu roadmap." />
                <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                  {openTasks.length ? openTasks.slice(0, 8).map((task) => (
                    <button key={task.id} type="button" onClick={() => setTab("tasks")} className="grid w-full gap-1 py-3 text-left sm:grid-cols-[1fr_150px_130px] sm:items-center">
                      <span className="text-[13px] font-medium text-[var(--bc-ink)]">{task.title}</span>
                      <span className="text-[12px] text-[var(--bc-muted)]">{task.assignee?.username ?? "Nieprzypisane"}</span>
                      <span className="text-[11px] text-[var(--bc-faint)] sm:text-right">{TASK_LABELS[task.status]}</span>
                    </button>
                  )) : <EmptyLine title="Brak otwartych zadań" description="Dodaj następne kroki w zakładce Zadania." />}
                </div>
              </div>
            </section>
          ) : null}

          {tab === "links" ? (
            <section className="pt-5">
              <SectionHeading title="Linki zespołu" description="Repo, Figma, Notion, Discord, demo i dokumentacja w jednym miejscu. Pliki zostają w narzędziach, które już ich pilnują." />
              <div className="grid gap-2 border-b border-[var(--bc-line)] pb-5 md:grid-cols-[130px_180px_minmax(0,1fr)_auto]">
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
                    if (result.success) {
                      setLinkLabel("");
                      setLinkUrl("");
                    }
                    return result;
                  }, "Dodano link")}
                >
                  Dodaj
                </Button>
              </div>
              <div className="divide-y divide-[var(--bc-line)] border-b border-[var(--bc-line)]">
                {links.length ? links.map((link) => {
                  const canDelete = link.createdBy === viewerId || isOwner;
                  return (
                    <div key={link.id} className="grid gap-2 py-3 sm:grid-cols-[120px_minmax(0,1fr)_150px_auto] sm:items-center">
                      <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--bc-faint)]">{LINK_LABELS[link.kind]}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-sm font-medium text-[var(--bc-ink)] hover:underline">{link.label}</a>
                      <span className="text-[11px] text-[var(--bc-faint)]">Dodano {formatDate(link.createdAt)}</span>
                      <div className="flex items-center justify-end gap-1">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Otwórz ${link.label}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><ExternalLink className="h-3.5 w-3.5" /></a>
                        {canDelete ? <IconDeleteButton label="Usuń link" onClick={() => run(() => deleteProjectWorkspaceLink(link.id))} /> : null}
                      </div>
                    </div>
                  );
                }) : <EmptyLine title="Brak linków zespołu" description="Dodaj tylko rzeczy, do których zespół naprawdę wraca podczas pracy." />}
              </div>
            </section>
          ) : null}

          {tab === "activity" ? (
            <section className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--bc-line)] pb-4">
                <SectionHeading title="Aktywność projektu" description="Historia ważnych zmian: plan, zadania, linki i zespół. Treść czatu nie jest tutaj kopiowana." />
                <div className="flex flex-wrap gap-1">
                  {(["ALL", "TASKS", "PROJECT", "TEAM"] as ActivityFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActivityFilter(filter)}
                      className={`rounded-[5px] px-2.5 py-1.5 text-[12px] ${activityFilter === filter ? "bg-[var(--bc-surface-subtle)] font-medium text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}
                    >
                      {filter === "ALL" ? "Wszystko" : filter === "TASKS" ? "Zadania" : filter === "TEAM" ? "Zespół" : "Projekt"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[var(--bc-line)]">
                {filteredActivity.length ? filteredActivity.map((item) => (
                  <div key={item.id} className="grid gap-1 py-3 sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:items-baseline">
                    <span className="text-[12px] font-medium text-[var(--bc-ink)]">{item.actor?.username ?? "BuildCrew"}</span>
                    <span className="text-[13px] text-[var(--bc-muted)]">{item.body}</span>
                    <time className="text-[11px] text-[var(--bc-faint)] sm:text-right" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                  </div>
                )) : <EmptyLine title="Brak aktywności" description="Zmiany pojawią się tutaj automatycznie." />}
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
  const items: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Przegląd" },
    { key: "chat", label: "Rozmowa", count: unreadCount },
    { key: "tasks", label: "Zadania", count: openTaskCount },
    { key: "plan", label: "Plan" },
    { key: "links", label: "Linki", count: linkCount },
    { key: "activity", label: "Aktywność" },
  ];
  return (
    <div className="flex overflow-x-auto border-b border-[var(--bc-line)]" role="tablist" aria-label="Workspace projektu">
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
  const latestMessages = messages.filter((message) => !message.deletedAt).slice(-3).reverse();
  return (
    <section className="pt-5">
      <div className="grid border-y border-[var(--bc-line)] md:grid-cols-2">
        <div className="border-b border-[var(--bc-line)] py-5 md:border-b-0 md:border-r md:pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Na teraz</p>
          <p className="mt-2 max-w-[620px] text-[15px] font-medium leading-6 text-[var(--bc-ink)]">{workspace?.currentFocus || "Brak ustawionego fokusu."}</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="mt-3 text-[12px] font-medium text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">{workspace?.currentFocus ? "Edytuj fokus" : "Ustaw fokus"}</button> : null}
        </div>
        <div className="py-5 md:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Najbliższy milestone</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium leading-5 text-[var(--bc-ink)]">{workspace?.milestoneTitle || "Brak ustawionego milestone'u"}</p>
              {workspace?.milestoneDueAt ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{formatDate(workspace.milestoneDueAt)} · {MILESTONE_LABELS[workspace.milestoneStatus]}</p> : workspace?.milestoneTitle ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{MILESTONE_LABELS[workspace.milestoneStatus]}</p> : null}
            </div>
            {workspace?.milestoneStatus === "DONE" ? <CheckCircle2 className="h-4 w-4 text-[var(--bc-accent-strong)]" /> : null}
          </div>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="mt-3 text-[12px] font-medium text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">{workspace?.milestoneTitle ? "Edytuj milestone" : "Ustaw milestone"}</button> : null}
        </div>
      </div>

      <div className="grid border-b border-[var(--bc-line)] md:grid-cols-[1fr_1fr]">
        <div className="border-b border-[var(--bc-line)] py-5 md:border-b-0 md:border-r md:pr-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title="Zadania" description="Stan pracy zespołu." />
            <button type="button" onClick={onOpenTasks} className="text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Otwórz →</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Do zrobienia" value={taskCounts.TODO} />
            <Metric label="W trakcie" value={taskCounts.DOING} />
            <Metric label="Gotowe" value={taskCounts.DONE} />
          </div>
          {assignedToViewer.length ? <p className="mt-4 text-[12px] text-[var(--bc-muted)]">Przypisane Tobie: <strong className="font-medium text-[var(--bc-ink)]">{assignedToViewer.length}</strong></p> : null}
          {overdueTasks.length ? <p className="mt-1 text-[12px] text-red-700 dark:text-red-400">Po terminie: {overdueTasks.length}</p> : null}
          {!tasks.length ? <p className="mt-4 text-[12px] text-[var(--bc-faint)]">Nie dodano jeszcze zadań.</p> : null}
        </div>

        <div className="py-5 md:pl-6">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title="Ostatnia rozmowa" description="Najnowsze ustalenia zespołu." />
            <button type="button" onClick={onOpenChat} className="text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Rozmowa →</button>
          </div>
          <div className="divide-y divide-[var(--bc-line)]">
            {latestMessages.length ? latestMessages.map((message) => (
              <button key={message.id} type="button" onClick={() => onFocusMessage(message.id)} className="grid w-full gap-1 py-2.5 text-left sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="truncate text-[11px] font-medium text-[var(--bc-ink)]">{message.sender?.username ?? "Builder"}</span>
                <span className="truncate text-[12px] text-[var(--bc-muted)]">{message.body}</span>
              </button>
            )) : <p className="py-4 text-[12px] text-[var(--bc-faint)]">Brak wiadomości.</p>}
          </div>
        </div>
      </div>

      <div className="py-5">
        <SectionHeading title="Ostatnia aktywność" description="Najważniejsze zmiany poza rozmową." />
        <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
          {activity.length ? activity.slice(0, 5).map((item) => (
            <div key={item.id} className="grid gap-1 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:items-baseline">
              <span className="text-[11px] font-medium text-[var(--bc-ink)]">{item.actor?.username ?? "BuildCrew"}</span>
              <span className="text-[12px] text-[var(--bc-muted)]">{item.body}</span>
              <time className="text-[11px] text-[var(--bc-faint)] sm:text-right">{formatDateTime(item.createdAt)}</time>
            </div>
          )) : <p className="py-5 text-[12px] text-[var(--bc-faint)]">Aktywność pojawi się po pierwszych zmianach w workspace.</p>}
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
            <time className="text-[11px] text-[var(--bc-faint)]" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
            {item.editedAt && !item.deletedAt ? <span className="text-[11px] text-[var(--bc-faint)]">edytowano</span> : null}
            {item.pinnedAt ? <Pin className="h-3 w-3 text-[var(--bc-muted)]" aria-label="Przypięta wiadomość" /> : null}
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
              <Button type="button" size="sm" disabled={pending || !editingMessageBody.trim()} onClick={onSaveEdit}>Zapisz</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingMessageId(null); setEditingMessageBody(""); }}>Anuluj</Button>
            </div>
          </div>
        ) : item.deletedAt ? (
          <p className="mt-0.5 text-[13px] italic leading-5 text-[var(--bc-faint)]">Wiadomość została usunięta.</p>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--bc-ink)]">{renderMentions(item.body)}</p>
        )}

        {!item.deletedAt && editingMessageId !== item.id ? (
          <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1">
            {checkUsers.length ? <ReactionButton active={checkedByViewer} label="Potwierdzone" count={checkUsers.length} icon={<Check className="h-3 w-3" />} onClick={() => onReaction("CHECK")} /> : null}
            {likeUsers.length ? <ReactionButton active={likedByViewer} label="Lubię" count={likeUsers.length} icon={<ThumbsUp className="h-3 w-3" />} onClick={() => onReaction("LIKE")} /> : null}

            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {!checkUsers.length ? <MiniAction label="Potwierdź" onClick={() => onReaction("CHECK")}><Check className="h-3 w-3" /></MiniAction> : null}
              {!likeUsers.length ? <MiniAction label="Lubię" onClick={() => onReaction("LIKE")}><ThumbsUp className="h-3 w-3" /></MiniAction> : null}
              <MiniAction label="Odpowiedz" onClick={onReply}><Reply className="h-3 w-3" /></MiniAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Więcej akcji" className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={onCreateTask}><ListPlus className="h-3.5 w-3.5" /> Utwórz zadanie</DropdownMenuItem>
                  {isOwner ? <DropdownMenuItem onSelect={onPin}>{item.pinnedAt ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />} {item.pinnedAt ? "Odepnij" : "Przypnij"}</DropdownMenuItem> : null}
                  {canEdit ? <DropdownMenuItem onSelect={onEdit}><Pencil className="h-3.5 w-3.5" /> Edytuj</DropdownMenuItem> : null}
                  {canDelete ? <DropdownMenuSeparator /> : null}
                  {canDelete ? <DropdownMenuItem onSelect={onDelete} className="text-red-700 focus:text-red-700 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /> Usuń</DropdownMenuItem> : null}
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
  const canDelete = task.createdBy === viewerId || projectOwnerId === viewerId;
  const overdue = Boolean(task.dueAt && task.status !== "DONE" && new Date(task.dueAt).getTime() < Date.now());
  if (editing) {
    return (
      <div className="grid gap-2 py-3">
        <Input value={editTitle} maxLength={160} onChange={(event) => setEditTitle(event.target.value)} />
        <Textarea value={editDescription} maxLength={800} onChange={(event) => setEditDescription(event.target.value)} placeholder="Opis zadania" className="min-h-[72px]" />
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={selectClass} value={editAssignee} onChange={(event) => setEditAssignee(event.target.value)}>
            <option value="">Nieprzypisane</option>
            {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
          </select>
          <Input type="date" value={editDueAt} onChange={(event) => setEditDueAt(event.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={pending || editTitle.trim().length < 2} onClick={onSaveEdit}>Zapisz</Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>Anuluj</Button>
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
          {task.dueAt ? <span className={overdue ? "text-red-700 dark:text-red-400" : ""}>Termin: {formatDate(task.dueAt)}{overdue ? " · po terminie" : ""}</span> : null}
          {task.sourceMessageId ? <button type="button" onClick={onSourceMessage} className="underline underline-offset-2">Z rozmowy →</button> : null}
        </div>
      </div>
      <select className={`${selectClass} h-9 text-[12px]`} value={task.assigneeId ?? ""} onChange={(event) => onAssign(event.target.value)}>
        <option value="">Nieprzypisane</option>
        {members.map((member) => <option key={member.userId} value={member.userId}>{member.profile?.username ?? "Builder"}</option>)}
      </select>
      <select className={`${selectClass} h-9 text-[12px]`} value={task.status} onChange={(event) => onStatus(event.target.value as WorkspaceTask["status"])}>
        {Object.entries(TASK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="flex items-center justify-end gap-1">
        {!task.assigneeId ? <button type="button" onClick={() => onAssign(viewerId)} className="mr-1 text-[11px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Przypisz mnie</button> : null}
        <button type="button" aria-label="Edytuj zadanie" onClick={onBeginEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><Pencil className="h-3.5 w-3.5" /></button>
        {canDelete ? <IconDeleteButton label="Usuń zadanie" onClick={onDelete} /> : null}
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
  return (
    <div className="space-y-6">
      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Zespół · {members.length}</p>
          {assignedToViewer ? <span className="text-[11px] text-[var(--bc-muted)]">{assignedToViewer} dla Ciebie</span> : null}
        </div>
        <div className="mt-3 divide-y divide-[var(--bc-line)]">
          {members.map((member) => {
            const username = member.profile?.username ?? "Builder";
            return (
              <Link key={member.userId} href={`/builders/${member.userId}`} className="flex items-center gap-3 py-2 first:pt-0 hover:bg-[var(--bc-surface-subtle)]">
                <Avatar username={username} seed={member.userId} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--bc-ink)]">{username}{member.userId === viewerId ? " · Ty" : ""}</p>
                  <p className="text-[11px] text-[var(--bc-faint)]">{member.isOwner ? "Autor" : member.roleType ? ROLE_LABELS[member.roleType] : member.profile?.role ? ROLE_LABELS[member.profile.role] : "Członek"}</p>
                </div>
                <span className="text-[11px] text-[var(--bc-faint)]">{activityLabel(member.profile?.lastActiveAt ?? null)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Na teraz</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="text-[11px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Edytuj</button> : null}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-[var(--bc-ink)]">{workspace?.currentFocus || "Brak ustawionego fokusu."}</p>
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Milestone</p>
          {isOwner ? <button type="button" onClick={onOpenPlan} className="text-[11px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Edytuj</button> : null}
        </div>
        <p className="mt-2 text-[13px] font-medium leading-5 text-[var(--bc-ink)]">{workspace?.milestoneTitle || "Brak ustawionego milestone'u"}</p>
        {workspace?.milestoneDueAt ? <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{formatDate(workspace.milestoneDueAt)}</p> : null}
        {workspace?.milestoneTitle ? <span className="mt-2 inline-flex rounded-[4px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--bc-muted)]">{MILESTONE_LABELS[workspace.milestoneStatus]}</span> : null}
      </section>

      <section className="border-b border-[var(--bc-line)] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Przypięte · {pinnedMessages.length}</p>
        <div className="mt-2 divide-y divide-[var(--bc-line)]">
          {pinnedMessages.length ? pinnedMessages.slice(0, 4).map((item) => (
            <button key={item.id} type="button" onClick={() => onOpenPinned(item.id)} className="w-full py-2 text-left">
              <p className="line-clamp-2 text-[12px] leading-4 text-[var(--bc-ink)]">{item.body}</p>
              <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{item.sender?.username ?? "Builder"} · {formatDate(item.createdAt)}</p>
            </button>
          )) : <p className="py-2 text-[11px] text-[var(--bc-faint)]">Brak przypiętych ustaleń.</p>}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Linki · {links.length}</p>
        <div className="mt-2 space-y-1.5">
          {links.length ? links.slice(0, 4).map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 py-1 text-[12px] text-[var(--bc-ink)] hover:underline">
              <span className="truncate">{link.label}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-[var(--bc-faint)]" />
            </a>
          )) : <p className="py-1 text-[11px] text-[var(--bc-faint)]">Brak linków projektu.</p>}
        </div>
      </section>
    </div>
  );
}

function MilestoneReadOnly({ workspace }: { workspace: WorkspaceOverview }) {
  if (!workspace?.milestoneTitle) return <p className="text-[13px] text-[var(--bc-muted)]">Brak ustawionego milestone'u.</p>;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[15px] font-medium text-[var(--bc-ink)]">{workspace.milestoneTitle}</p>
        <span className="rounded-[4px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--bc-muted)]">{MILESTONE_LABELS[workspace.milestoneStatus]}</span>
      </div>
      {workspace.milestoneDescription ? <p className="mt-2 max-w-[720px] text-sm leading-6 text-[var(--bc-muted)]">{workspace.milestoneDescription}</p> : null}
      {workspace.milestoneDueAt ? <p className="mt-2 text-[12px] text-[var(--bc-faint)]">Termin: {formatDate(workspace.milestoneDueAt)}</p> : null}
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function activityLabel(value: string | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 24 * 60 * 60 * 1000) return "dziś";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "ten tydz.";
  return "";
}

const selectClass = "h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm text-[var(--bc-ink)] outline-none focus:border-[var(--bc-line-strong)] focus:ring-2 focus:ring-[var(--bc-accent-soft)]";
