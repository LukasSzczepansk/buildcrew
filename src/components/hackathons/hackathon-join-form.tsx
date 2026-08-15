"use client";

import * as React from "react";
import { toast } from "sonner";
import type { HackathonAvailability, HackathonGoal, RoleType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HACKATHON_AVAILABILITY_LABELS, HACKATHON_GOAL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { saveHackathonParticipation } from "@/server/actions/hackathons";

const ROLES = Object.keys(ROLE_LABELS) as RoleType[];
const GOALS = Object.keys(HACKATHON_GOAL_LABELS) as HackathonGoal[];
const AVAILABILITY = Object.keys(HACKATHON_AVAILABILITY_LABELS) as HackathonAvailability[];

function csv(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12); }

export function HackathonJoinForm({ hackathonId, eventThemes, minTeamSize, maxTeamSize, initial }: { hackathonId: string; eventThemes: string[]; minTeamSize: number; maxTeamSize: number; initial?: { role: RoleType; technologies: string[]; themes: string[]; hasIdea: boolean; ideaSummary: string | null; goal: HackathonGoal; availability: HackathonAvailability; preferredTeamSize: number } | null }) {
  const [pending, setPending] = React.useState(false);
  const [role, setRole] = React.useState<RoleType>(initial?.role ?? "FULLSTACK");
  const [technologies, setTechnologies] = React.useState((initial?.technologies ?? []).join(", "));
  const [themes, setThemes] = React.useState<string[]>(initial?.themes ?? []);
  const [goal, setGoal] = React.useState<HackathonGoal>(initial?.goal ?? "BUILD");
  const [availability, setAvailability] = React.useState<HackathonAvailability>(initial?.availability ?? "FULL_EVENT");
  const [hasIdea, setHasIdea] = React.useState(initial?.hasIdea ?? false);
  const [ideaSummary, setIdeaSummary] = React.useState(initial?.ideaSummary ?? "");
  const [preferredTeamSize, setPreferredTeamSize] = React.useState(initial?.preferredTeamSize ?? Math.min(4, maxTeamSize));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true);
    const result = await saveHackathonParticipation({ hackathonId, role, technologies: csv(technologies), themes, goal, availability, hasIdea, ideaSummary, preferredTeamSize });
    setPending(false);
    if (result?.error) toast.error(result.error); else toast.success(initial ? "Preferencje zapisane." : "Jesteś w puli szukających zespołu.");
  }

  function toggleTheme(theme: string) { setThemes((current) => current.includes(theme) ? current.filter((item) => item !== theme) : current.length < 8 ? [...current, theme] : current); }

  return (
    <form onSubmit={submit} className="border-y border-[var(--bc-line)] py-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Twój profil na wydarzenie</p><h2 className="mt-1 text-[18px] font-semibold">{initial ? "Preferencje team matchingu" : "Szukam zespołu"}</h2></div><p className="max-w-[420px] text-[12px] leading-5 text-[var(--bc-muted)]">Te dane służą tylko do dopasowania ludzi na ten hackathon. Możesz je później zmienić.</p></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><Label>Rola w teamie</Label><select value={role} onChange={(e) => setRole(e.target.value as RoleType)} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></div>
        <div><Label>Preferowany rozmiar teamu</Label><select value={preferredTeamSize} onChange={(e) => setPreferredTeamSize(Number(e.target.value))} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, index) => minTeamSize + index).map((size) => <option key={size} value={size}>{size} osoby</option>)}</select></div>
        <div className="md:col-span-2"><Label>Technologie, z którymi chcesz pracować</Label><Input className="mt-1.5" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, TypeScript, Python, Figma" /><p className="mt-1 text-[11px] text-[var(--bc-faint)]">Oddziel przecinkami. Nie musisz wpisywać całego stacku.</p></div>
      </div>
      {eventThemes.length ? <div className="mt-4"><Label>Co chcesz budować?</Label><div className="mt-2 flex flex-wrap gap-2">{eventThemes.map((theme) => <button type="button" key={theme} onClick={() => toggleTheme(theme)} className={`rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${themes.includes(theme) ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>{theme}</button>)}</div></div> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><Label>Cel</Label><div className="mt-2 space-y-2">{GOALS.map((item) => <label key={item} className="flex cursor-pointer items-start gap-2 text-[13px]"><input type="radio" className="mt-0.5" checked={goal === item} onChange={() => setGoal(item)} /><span>{HACKATHON_GOAL_LABELS[item]}</span></label>)}</div></div>
        <div><Label>Dostępność</Label><select value={availability} onChange={(e) => setAvailability(e.target.value as HackathonAvailability)} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{AVAILABILITY.map((item) => <option key={item} value={item}>{HACKATHON_AVAILABILITY_LABELS[item]}</option>)}</select></div>
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={hasIdea} onChange={(e) => setHasIdea(e.target.checked)} />Mam pomysł na hackathon</label>
      {hasIdea ? <div className="mt-3"><Label>Pomysł w 1–2 zdaniach</Label><Textarea className="mt-1.5 min-h-20" value={ideaSummary} onChange={(e) => setIdeaSummary(e.target.value)} maxLength={360} placeholder="Co chcesz spróbować zbudować?" /></div> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Zapisywanie…" : initial ? "Zapisz preferencje" : "Dołącz do puli"}</Button><span className="text-[12px] text-[var(--bc-faint)]">Dołączenie tutaj nie rejestruje Cię na oficjalne wydarzenie.</span></div>
    </form>
  );
}
