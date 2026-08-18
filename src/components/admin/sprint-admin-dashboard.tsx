"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, Megaphone, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMITMENT_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, RoleType, SprintApplicationData, SprintCheckInHealth, SprintParticipantStatus } from "@/db/schema";
import {
  createSprintAnnouncement,
  createSprintCrew,
  getSprintAdminMatches,
  setSprintParticipantStatus,
  updateSprintSettings,
} from "@/server/actions/challenges";

type Application = {
  userId: string;
  mode: "HAS_CREW" | "FIND_CREW";
  crewId: string | null;
  role: RoleType | null;
  participantStatus: SprintParticipantStatus;
  adminNote: string | null;
  applicationData: SprintApplicationData | null;
  updatedAt: string;
  username: string;
  avatarEmoji: string;
};

type Match = { userId: string; username: string; avatarEmoji: string; role: RoleType; score: number; reasons: string[] };

type Props = {
  challenge: {
    id: string;
    title: string;
    status: string;
    startsAt: string;
    endsAt: string;
    settings: {
      capacity?: number;
      applicationsCloseAt?: string;
      teamRevealAt?: string;
      demoDayAt?: string;
      minWeeklyHours?: Commitment;
      allowedRoles?: RoleType[];
      maxCrewSize?: number;
    };
  };
  applications: Application[];
  crews: { id: string; members: Application[] }[];
  latestCheckIns: { userId: string; username: string; avatarEmoji: string; health: SprintCheckInHealth; note: string | null; weekKey: string; updatedAt: string }[];
  announcements: { id: string; title: string; body: string; audience: "ALL" | "ACCEPTED" | "UNMATCHED"; createdAt: string }[];
  counts: { total: number; accepted: number; unmatched: number; crews: number; green: number; yellow: number; red: number };
  roleCounts: Partial<Record<RoleType, number>>;
};

const STATUSES: SprintParticipantStatus[] = ["APPLIED", "ACCEPTED", "WAITLIST", "REJECTED", "MATCHED", "BUILDING", "COMPLETED", "DROPPED"];
const ROLE_FILTERS: (RoleType | "ALL")[] = ["ALL", "FRONTEND", "BACKEND", "FULLSTACK", "UI_UX", "MOBILE", "AI_ML", "PRODUCT", "MARKETING"];

export function SprintAdminDashboard(props: Props) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SprintParticipantStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = React.useState<RoleType | "ALL">("ALL");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState(false);
  const [matches, setMatches] = React.useState<Record<string, Match[]>>({});
  const [notes, setNotes] = React.useState<Record<string, string>>(Object.fromEntries(props.applications.map((item) => [item.userId, item.adminNote ?? ""])));
  const [announcement, setAnnouncement] = React.useState({ title: "", body: "", audience: "ALL" as "ALL" | "ACCEPTED" | "UNMATCHED" });
  const [settings, setSettings] = React.useState({
    capacity: props.challenge.settings.capacity ?? 40,
    applicationsCloseAt: toLocal(props.challenge.settings.applicationsCloseAt ?? props.challenge.startsAt),
    teamRevealAt: toLocal(props.challenge.settings.teamRevealAt ?? props.challenge.startsAt),
    demoDayAt: toLocal(props.challenge.settings.demoDayAt ?? props.challenge.endsAt),
    maxCrewSize: props.challenge.settings.maxCrewSize ?? 4,
    minWeeklyHours: props.challenge.settings.minWeeklyHours ?? ("3-5" as Commitment),
    allowedRoles: props.challenge.settings.allowedRoles ?? ([] as RoleType[]),
  });

  const filtered = props.applications.filter((item) => {
    const appRole = item.applicationData?.role ?? item.role;
    if (statusFilter !== "ALL" && item.participantStatus !== statusFilter) return false;
    if (roleFilter !== "ALL" && appRole !== roleFilter) return false;
    return item.username.toLowerCase().includes(search.toLowerCase().trim());
  });
  const eligibleForCrew = props.applications.filter((item) => !item.crewId && !["REJECTED", "DROPPED"].includes(item.participantStatus));

  function toggleSelected(userId: string) {
    setSelected((current) => current.includes(userId) ? current.filter((id) => id !== userId) : current.length < settings.maxCrewSize ? [...current, userId] : current);
  }

  async function changeStatus(item: Application, status: SprintParticipantStatus) {
    setPending(true);
    const result = await setSprintParticipantStatus({ challengeId: props.challenge.id, userId: item.userId, status, adminNote: notes[item.userId] ?? "" });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Status uczestnika zmieniony.");
  }

  async function loadMatches(userId: string) {
    setPending(true);
    const result = await getSprintAdminMatches(props.challenge.id, userId);
    setPending(false);
    if (result?.error) return toast.error(result.error);
    setMatches((current) => ({ ...current, [userId]: result.matches ?? [] }));
  }

  async function buildCrew() {
    if (selected.length < 2) return toast.error("Wybierz minimum 2 osoby.");
    setPending(true);
    const result = await createSprintCrew({ challengeId: props.challenge.id, userIds: selected });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Crew utworzona i uczestnicy powiadomieni.");
    setSelected([]);
  }

  async function sendAnnouncement() {
    setPending(true);
    const result = await createSprintAnnouncement({ challengeId: props.challenge.id, ...announcement });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success(`Ogłoszenie wysłane do ${result.recipients ?? 0} osób.`);
    setAnnouncement({ title: "", body: "", audience: "ALL" });
  }

  async function saveSettings() {
    setPending(true);
    const result = await updateSprintSettings({
      challengeId: props.challenge.id,
      capacity: settings.capacity,
      applicationsCloseAt: settings.applicationsCloseAt ? new Date(settings.applicationsCloseAt).toISOString() : "",
      teamRevealAt: settings.teamRevealAt ? new Date(settings.teamRevealAt).toISOString() : "",
      demoDayAt: settings.demoDayAt ? new Date(settings.demoDayAt).toISOString() : "",
      maxCrewSize: settings.maxCrewSize,
      minWeeklyHours: settings.minWeeklyHours,
      allowedRoles: settings.allowedRoles,
    });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Ustawienia Sprintu zapisane.");
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Sprint control center</p><h3 className="mt-1 text-xl font-semibold">{props.challenge.title}</h3></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Zgłoszenia" value={props.counts.total} detail={`${props.counts.accepted} zaakceptowanych`} /><Metric label="Bez Crew" value={props.counts.unmatched} detail="do matchingu" /><Metric label="Utworzone Crew" value={props.counts.crews} detail={`max ${settings.maxCrewSize} osób`} /><Metric label="Check-in alerty" value={props.counts.red + props.counts.yellow} detail={`${props.counts.red} czerwonych · ${props.counts.yellow} żółtych`} /></div>
        <Card className="mt-3 p-4"><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">{Object.entries(props.roleCounts).map(([role, count]) => <span key={role}><strong>{ROLE_LABELS[role as RoleType]}</strong> <span className="text-neutral-500">{count}</span></span>)}</div></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Szukaj uczestnika..." /></div><select className="h-10 rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SprintParticipantStatus | "ALL")}><option value="ALL">Wszystkie statusy</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><select className="h-10 rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleType | "ALL")}><option value="ALL">Wszystkie role</option>{ROLE_FILTERS.filter((role) => role !== "ALL").map((role) => <option key={role} value={role}>{ROLE_LABELS[role as RoleType]}</option>)}</select></div>
          <div className="space-y-3">{filtered.map((item) => <ApplicationCard key={item.userId} item={item} pending={pending} selected={selected.includes(item.userId)} note={notes[item.userId] ?? ""} onNote={(value) => setNotes((current) => ({ ...current, [item.userId]: value }))} onToggle={() => toggleSelected(item.userId)} onStatus={(status) => changeStatus(item, status)} onMatches={() => loadMatches(item.userId)} onAddMatch={(candidateId) => setSelected(Array.from(new Set([item.userId, candidateId])).slice(0, settings.maxCrewSize))} matches={matches[item.userId]} />)}{!filtered.length ? <Card className="p-5 text-sm text-neutral-500">Brak zgłoszeń pasujących do filtrów.</Card> : null}</div>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-5 p-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Crew Builder</p><h3 className="mt-1 font-semibold">Wybrane osoby: {selected.length}/{settings.maxCrewSize}</h3></div><Users className="h-5 w-5 text-[#7c9f14]" /></div><div className="mt-4 space-y-2">{selected.map((userId) => { const item = eligibleForCrew.find((entry) => entry.userId === userId); return item ? <button key={userId} onClick={() => toggleSelected(userId)} className="flex w-full items-center gap-2 rounded-[7px] border border-lime-500 bg-lime-300/25 p-2 text-left text-sm"><span>{item.avatarEmoji}</span><span className="flex-1 font-medium">{item.username}</span><span className="text-xs text-neutral-500">{ROLE_LABELS[(item.applicationData?.role ?? item.role) as RoleType]}</span></button> : null; })}{!selected.length ? <p className="rounded-[7px] border border-dashed border-neutral-300 p-4 text-sm leading-6 text-neutral-500 dark:border-neutral-700">Zaznacz 2-{settings.maxCrewSize} zaakceptowanych uczestników. Możesz też użyć rekomendacji matchingu na kartach zgłoszeń.</p> : null}</div><Button className="mt-4 w-full" onClick={buildCrew} disabled={pending || selected.length < 2}>Utwórz Crew</Button></Card>
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Crew</p><h3 className="mt-1 text-lg font-semibold">Utworzone zespoły</h3></div>
        {props.crews.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{props.crews.map((crew, index) => <Card key={crew.id} className="p-5"><div className="flex items-center justify-between"><p className="font-semibold">Crew #{index + 1}</p><span className="text-xs text-neutral-400">{crew.members.length} osoby</span></div><div className="mt-4 space-y-2">{crew.members.map((member) => <div key={member.userId} className="flex items-center gap-2 text-sm"><span>{member.avatarEmoji}</span><span className="flex-1 font-medium">{member.username}</span><span className="text-xs text-neutral-500">{ROLE_LABELS[(member.applicationData?.role ?? member.role) as RoleType]}</span></div>)}</div></Card>)}</div> : <Card className="p-5 text-sm text-neutral-500">Nie utworzono jeszcze żadnej Crew.</Card>}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><h3 className="font-semibold">Weekly check-ins</h3></div><p className="mt-1 text-sm text-neutral-500">Czerwone i żółte sygnały są na górze, żeby szybko zareagować.</p><div className="mt-4 space-y-2">{[...props.latestCheckIns].sort((a, b) => healthOrder(a.health) - healthOrder(b.health)).map((item) => <div key={item.userId} className="rounded-[7px] border border-neutral-200 p-3 dark:border-neutral-700"><div className="flex items-center gap-2 text-sm"><span>{healthEmoji(item.health)}</span><span>{item.avatarEmoji}</span><strong>{item.username}</strong><span className="ml-auto text-xs text-neutral-400">{item.weekKey}</span></div>{item.note ? <p className="mt-2 text-sm leading-6 text-neutral-500">{item.note}</p> : null}</div>)}{!props.latestCheckIns.length ? <p className="text-sm text-neutral-500">Brak check-inów.</p> : null}</div></Card>

        <Card className="p-5"><div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-[#7c9f14]" /><h3 className="font-semibold">Ogłoszenie do uczestników</h3></div><div className="mt-4 space-y-3"><div><Label>Tytuł</Label><Input className="mt-1.5" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} placeholder="Team Reveal jutro o 18:00" /></div><div><Label>Treść</Label><Textarea className="mt-1.5" rows={4} value={announcement.body} onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })} /></div><div><Label>Odbiorcy</Label><select className="mt-1.5 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={announcement.audience} onChange={(e) => setAnnouncement({ ...announcement, audience: e.target.value as typeof announcement.audience })}><option value="ALL">Wszyscy aktywni</option><option value="ACCEPTED">Zaakceptowani / dopasowani</option><option value="UNMATCHED">Bez Crew</option></select></div><Button onClick={sendAnnouncement} disabled={pending} className="w-full">Wyślij ogłoszenie</Button></div>{props.announcements.length ? <div className="mt-5 border-t border-[var(--bc-line)] pt-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Ostatnie</p>{props.announcements.slice(0, 3).map((item) => <div key={item.id} className="mt-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{item.body}</p></div>)}</div> : null}</Card>
      </section>

      <section><Card className="p-5"><h3 className="font-semibold">Ustawienia aktywnej edycji</h3><p className="mt-1 text-sm text-neutral-500">Te dane zasilają publiczną stronę Sprintu i zasady formularza.</p><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Setting label="Limit miejsc"><Input type="number" min={4} max={500} value={settings.capacity} onChange={(e) => setSettings({ ...settings, capacity: Number(e.target.value) })} /></Setting><Setting label="Deadline zgłoszeń"><Input type="datetime-local" value={settings.applicationsCloseAt} onChange={(e) => setSettings({ ...settings, applicationsCloseAt: e.target.value })} /></Setting><Setting label="Team Reveal"><Input type="datetime-local" value={settings.teamRevealAt} onChange={(e) => setSettings({ ...settings, teamRevealAt: e.target.value })} /></Setting><Setting label="Demo Day"><Input type="datetime-local" value={settings.demoDayAt} onChange={(e) => setSettings({ ...settings, demoDayAt: e.target.value })} /></Setting><Setting label="Max Crew"><Input type="number" min={2} max={8} value={settings.maxCrewSize} onChange={(e) => setSettings({ ...settings, maxCrewSize: Number(e.target.value) })} /></Setting></div><div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]"><Setting label="Minimalna dostępność"><select className="h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={settings.minWeeklyHours} onChange={(e) => setSettings({ ...settings, minWeeklyHours: e.target.value as Commitment })}>{(["1-2", "3-5", "5-10", "10+"] as Commitment[]).map((value) => <option key={value} value={value}>{COMMITMENT_LABELS[value]}</option>)}</select></Setting><Setting label="Dozwolone role"><div className="flex flex-wrap gap-2">{ROLE_FILTERS.filter((role): role is RoleType => role !== "ALL").map((role) => { const active = settings.allowedRoles.includes(role); return <button type="button" key={role} onClick={() => setSettings({ ...settings, allowedRoles: active ? settings.allowedRoles.filter((item) => item !== role) : [...settings.allowedRoles, role] })} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-lime-500 bg-lime-300/30" : "border-neutral-200 dark:border-neutral-700"}`}>{ROLE_LABELS[role]}</button>; })}<span className="self-center text-xs text-neutral-400">{settings.allowedRoles.length ? "Tylko zaznaczone" : "Brak zaznaczeń = wszystkie role"}</span></div></Setting></div><div className="mt-4 flex justify-end"><Button onClick={saveSettings} disabled={pending}>Zapisz ustawienia</Button></div></Card></section>
    </div>
  );
}

function ApplicationCard({ item, pending, selected, note, onNote, onToggle, onStatus, onMatches, onAddMatch, matches }: { item: Application; pending: boolean; selected: boolean; note: string; onNote: (value: string) => void; onToggle: () => void; onStatus: (status: SprintParticipantStatus) => void; onMatches: () => void; onAddMatch: (candidateId: string) => void; matches?: Match[] }) {
  const application = item.applicationData;
  const role = application?.role ?? item.role;
  return <Card className={`p-5 ${selected ? "border-lime-500 ring-2 ring-lime-400/15" : ""}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><button type="button" onClick={onToggle} disabled={Boolean(item.crewId) || ["REJECTED", "DROPPED"].includes(item.participantStatus)} className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-lime-600 bg-[#c8f169] text-neutral-950" : "border-neutral-300 dark:border-neutral-600"}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</button><span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl dark:bg-neutral-800">{item.avatarEmoji}</span><div><p className="font-semibold">{item.username}</p><p className="mt-0.5 text-xs text-neutral-500">{role ? ROLE_LABELS[role] : "Brak roli"} · {item.mode === "HAS_CREW" ? "ma Crew" : "szuka Crew"}</p></div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.participantStatus)}`}>{statusLabel(item.participantStatus)}</span></div>{application ? <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Info label="Stack" value={application.skills.join(" · ")} /><Info label="Dostępność" value={COMMITMENT_LABELS[application.weeklyHours]} /><Info label="Kierunek" value={application.projectThemes.join(" · ")} /><Info label="Cele" value={application.sprintGoals.join(" · ")} />{application.ideaDescription ? <div className="sm:col-span-2"><Info label="Pomysł" value={application.ideaDescription} /></div> : null}</div> : <p className="mt-4 text-sm text-amber-600">Stary zapis bez nowego formularza.</p>}<div className="mt-4"><Textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} placeholder="Notatka admina, opcjonalnie..." /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={item.participantStatus === "ACCEPTED" ? "default" : "outline"} onClick={() => onStatus("ACCEPTED")} disabled={pending}>Akceptuj</Button><Button size="sm" variant="outline" onClick={() => onStatus("WAITLIST")} disabled={pending}>Waitlist</Button><Button size="sm" variant="outline" onClick={() => onStatus("REJECTED")} disabled={pending}>Odrzuć</Button>{item.crewId ? <Button size="sm" variant="outline" onClick={() => onStatus("BUILDING")} disabled={pending}>Building</Button> : <Button size="sm" variant="ghost" onClick={onMatches} disabled={pending}><Sparkles className="h-4 w-4" />Rekomendacje</Button>}</div>{matches ? <div className="mt-4 rounded-[8px] bg-neutral-50 p-3 dark:bg-neutral-900"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Najlepsze dopasowania</p><div className="mt-2 space-y-2">{matches.map((match) => <button type="button" onClick={() => onAddMatch(match.userId)} key={match.userId} className="flex w-full items-start gap-2 rounded-[6px] border border-neutral-200 bg-white p-2 text-left hover:border-lime-500 dark:border-neutral-700 dark:bg-neutral-950"><span>{match.avatarEmoji}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{match.username}</span><strong className="text-xs text-[#66820f]">{match.score}%</strong></div><p className="text-xs text-neutral-500">{ROLE_LABELS[match.role]} · {match.reasons.slice(0, 2).join(" · ")}</p></div></button>)}</div></div> : null}</Card>;
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) { return <Card className="p-4"><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-xs text-neutral-400">{detail}</p></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{label}</p><p className="mt-1 leading-6 text-neutral-600 dark:text-neutral-300">{value}</p></div>; }
function Setting({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>; }
function statusLabel(status: SprintParticipantStatus) { return ({ APPLIED: "Oczekuje", ACCEPTED: "Zaakceptowany", WAITLIST: "Waitlist", REJECTED: "Odrzucony", MATCHED: "Matched", BUILDING: "Building", COMPLETED: "Completed", DROPPED: "Dropped" } as const)[status]; }
function statusClass(status: SprintParticipantStatus) { if (["ACCEPTED", "MATCHED", "BUILDING", "COMPLETED"].includes(status)) return "bg-lime-100 text-lime-800 dark:bg-lime-400/10 dark:text-lime-300"; if (status === "REJECTED" || status === "DROPPED") return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"; if (status === "WAITLIST") return "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"; return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"; }
function healthEmoji(health: SprintCheckInHealth) { return health === "GREEN" ? "🟢" : health === "YELLOW" ? "🟡" : "🔴"; }
function healthOrder(health: SprintCheckInHealth) { return health === "RED" ? 0 : health === "YELLOW" ? 1 : 2; }
function toLocal(value: string) { const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
