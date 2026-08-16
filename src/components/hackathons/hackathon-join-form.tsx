"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import type { HackathonAvailability, HackathonGoal, RoleType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { HACKATHON_AVAILABILITY_LABELS, HACKATHON_GOAL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { cn } from "@/lib/utils";
import { saveHackathonParticipation } from "@/server/actions/hackathons";

const ROLES = Object.keys(ROLE_LABELS) as RoleType[];
const GOALS = Object.keys(HACKATHON_GOAL_LABELS) as HackathonGoal[];
const AVAILABILITY = Object.keys(HACKATHON_AVAILABILITY_LABELS) as HackathonAvailability[];

function csv(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12); }

export function HackathonJoinForm({ hackathonId, eventThemes, minTeamSize, maxTeamSize, initial }: { hackathonId: string; eventThemes: string[]; minTeamSize: number; maxTeamSize: number; initial?: { role: RoleType; technologies: string[]; themes: string[]; hasIdea: boolean; ideaSummary: string | null; goal: HackathonGoal; availability: HackathonAvailability; preferredTeamSize: number; } | null; }) {
  const copy = useCopy();
  const locale = useLocale();
  const labels = labelsFor(locale);
  const steps = locale === "en" ? ["Roles", "Stack", "Approach", "Ready"] : ["Roles", "Stack", "Approach", "Done"];
  const [step, setStep] = React.useState(0);
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
    if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
    toast.success(initial ? copy("Preferences saved.", "Preferences saved.") : copy("You're in the pool. We'll show you people and teams from this event.", "You're in the pool. We'll show you people and teams from this event."));
  }

  function toggleTheme(theme: string) { setThemes((current) => current.includes(theme) ? current.filter((item) => item !== theme) : current.length < 8 ? [...current, theme] : current); }
  function next() { if (step === 1 && csv(technologies).length === 0) { toast.error(copy("Add at least one technology or tool so matching has enough context.", "Add at least one technology or tool so matching has enough context.")); return; } setStep((current) => Math.min(3, current + 1)); }

  return (
    <form id="join" onSubmit={submit} className="scroll-mt-24 border-y border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
      <div className="px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Find your team · {copy("about 60 seconds", "about 60 seconds")}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">{initial ? copy("Update your preferences", "Update your preferences") : copy("Tell us who you're looking for", "Tell us who you're looking for")}</h2><p className="mt-1 max-w-[620px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("You're not creating a new profile from scratch. You're only setting context for this event.", "You're not creating a new profile from scratch. You're only setting context for this event.")}</p></div><span className="text-[12px] font-medium tabular-nums text-[var(--bc-faint)]">{copy("Step", "Step")} {step + 1} / 4</span></div>
        <div className="mt-5 grid grid-cols-4 border-y border-[var(--bc-line)]">{steps.map((label, index) => <button key={label} type="button" onClick={() => index <= step && setStep(index)} className={cn("relative min-w-0 border-r border-[var(--bc-line)] px-2 py-3 text-left last:border-r-0 sm:px-3", index === step && "bg-[var(--bc-surface-subtle)]")}>{index === step ? <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--bc-accent)]" /> : null}<span className="block text-[10px] font-semibold tabular-nums text-[var(--bc-faint)]">0{index + 1}</span><span className={cn("mt-0.5 block truncate text-[12px] font-medium", index <= step ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]")}>{label}</span></button>)}</div>
        <div className="min-h-[260px] py-5">
          {step === 0 ? <div><p className="text-[14px] font-semibold">{copy("What's your main role?", "What's your main role?")}</p><p className="mt-1 text-[12px] text-[var(--bc-muted)]">{copy("Choose what you actually want to work on during the hackathon.", "Choose what you actually want to work on during the hackathon.")}</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ROLES.map((item) => <button key={item} type="button" onClick={() => setRole(item)} className={cn("flex min-h-11 items-center justify-between rounded-[6px] border px-3 py-2.5 text-left text-[13px] font-medium transition-colors", role === item ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-[var(--bc-line)] bg-[var(--bc-surface)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]")}><span>{labels.roles[item]}</span>{role === item ? <Check className="h-3.5 w-3.5" /> : null}</button>)}</div><div className="mt-5 max-w-[320px]"><Label>{copy("Preferred team size", "Preferred team size")}</Label><select value={preferredTeamSize} onChange={(e) => setPreferredTeamSize(Number(e.target.value))} className="mt-1.5 h-10 w-full rounded-[6px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-3 text-sm">{Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, index) => minTeamSize + index).map((size) => <option key={size} value={size}>{size} {locale === "en" ? (size === 1 ? "person" : "people") : "people"}</option>)}</select></div></div> : null}
          {step === 1 ? <div><div className="max-w-[760px]"><Label>{copy("Technologies and tools you want to work with", "Technologies and tools you want to work with")}</Label><Input className="mt-1.5" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, TypeScript, Python, Figma" /><p className="mt-1 text-[11px] text-[var(--bc-faint)]">{copy("2–5 key items are enough. Separate them with commas.", "2–5 key items are enough. Separate them with commas.")}</p></div>{eventThemes.length ? <div className="mt-5"><Label>{copy("What are you interested in at this event?", "What are you interested in at this event?")}</Label><div className="mt-2 flex flex-wrap gap-2">{eventThemes.map((theme) => <button type="button" key={theme} onClick={() => toggleTheme(theme)} className={cn("rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors", themes.includes(theme) ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]")}>{theme}</button>)}</div></div> : null}</div> : null}
          {step === 2 ? <div className="grid gap-6 md:grid-cols-2"><div><p className="text-[14px] font-semibold">{copy("How do you want to approach the event?", "How do you want to approach the event?")}</p><div className="mt-3 space-y-2">{GOALS.map((item) => <label key={item} className={cn("flex cursor-pointer items-start gap-3 rounded-[6px] border px-3 py-3 text-[13px]", goal === item ? "border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)]" : "border-[var(--bc-line)]")}><input type="radio" className="mt-0.5" checked={goal === item} onChange={() => setGoal(item)} /><span>{labels.hackathonGoals[item]}</span></label>)}</div></div><div><p className="text-[14px] font-semibold">{copy("How much time do you realistically have?", "How much time do you realistically have?")}</p><div className="mt-3 space-y-2">{AVAILABILITY.map((item) => <label key={item} className={cn("flex cursor-pointer items-start gap-3 rounded-[6px] border px-3 py-3 text-[13px]", availability === item ? "border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)]" : "border-[var(--bc-line)]")}><input type="radio" className="mt-0.5" checked={availability === item} onChange={() => setAvailability(item)} /><span>{labels.hackathonAvailability[item]}</span></label>)}</div></div></div> : null}
          {step === 3 ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><div><p className="text-[14px] font-semibold">{copy("Do you already have an idea?", "Do you already have an idea?")}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setHasIdea(false)} className={cn("rounded-[6px] border px-3 py-2 text-[13px] font-medium", !hasIdea ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-[var(--bc-line)]")}>{copy("No - I'm open", "No - I'm open")}</button><button type="button" onClick={() => setHasIdea(true)} className={cn("rounded-[6px] border px-3 py-2 text-[13px] font-medium", hasIdea ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-[var(--bc-line)]")}>{copy("Yes - I have a direction", "Yes - I have a direction")}</button></div>{hasIdea ? <div className="mt-4"><Label>{copy("Idea in 1–2 sentences", "Idea in 1–2 sentences")}</Label><Textarea className="mt-1.5 min-h-24" value={ideaSummary} onChange={(e) => setIdeaSummary(e.target.value)} maxLength={360} placeholder={copy("What would you like to try building?", "What would you like to try building?")} /></div> : <p className="mt-4 max-w-[580px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("That's fine. Matching can connect you with people who already have an idea or are open to finding a direction together.", "That's fine. Matching can connect you with people who already have an idea or are open to finding a direction together.")}</p>}</div><div className="border-t border-[var(--bc-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Summary", "Summary")}</p><dl className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between gap-4"><dt className="text-[var(--bc-muted)]">{copy("Roles", "Roles")}</dt><dd className="font-medium text-right">{labels.roles[role]}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--bc-muted)]">Team</dt><dd className="font-medium">{preferredTeamSize}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--bc-muted)]">{copy("Goal", "Goal")}</dt><dd className="max-w-[180px] text-right font-medium">{labels.hackathonGoals[goal]}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--bc-muted)]">{copy("Availability", "Availability")}</dt><dd className="max-w-[180px] text-right font-medium">{labels.hackathonAvailability[availability]}</dd></div></dl><p className="mt-4 text-[11px] leading-4 text-[var(--bc-faint)]">{copy("This does not register you for the official hackathon. BuildCrew only helps you find people.", "This does not register you for the official hackathon. BuildCrew only helps you find people.")}</p></div></div> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-4"><Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || pending}><ArrowLeft className="h-3.5 w-3.5" /> {copy("Back", "Back")}</Button>{step < 3 ? <Button type="button" onClick={next}>{copy("Next", "Next")} <ArrowRight className="h-3.5 w-3.5" /></Button> : <Button type="submit" disabled={pending}>{pending ? copy("Saving…", "Saving…") : initial ? copy("Save and show matches", "Save and show matches") : copy("Join and show matches", "Join and show matches")}</Button>}</div>
      </div>
    </form>
  );
}
