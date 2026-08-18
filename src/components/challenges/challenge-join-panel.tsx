"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { ALL_SKILLS, COMMITMENT_LABELS, COMMITMENT_OPTIONS, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { cn } from "@/lib/utils";
import { appMessage } from "@/lib/server-copy";
import type { Commitment, Level, RoleType, SprintApplicationData } from "@/db/schema";
import { joinChallenge, leaveChallenge } from "@/server/actions/challenges";

type Participation = {
  mode: "HAS_CREW" | "FIND_CREW";
  crewId: string | null;
  applicationData: SprintApplicationData | null;
} | null;

type ProfileDefaults = {
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
} | null;

type FormState = Omit<SprintApplicationData, "version" | "submittedAt" | "commitmentAccepted"> & {
  commitmentAccepted: boolean;
  mode: "HAS_CREW" | "FIND_CREW";
  crewId: string;
};

const WORK_TIMES = ["WEEKDAY_MORNING", "WEEKDAY_EVENING", "WEEKENDS", "FLEXIBLE"] as const;
const SERIOUSNESS = ["LEARN", "PORTFOLIO", "SHIP"] as const;
const THEMES = ["SAAS", "AI", "MOBILE", "WEB", "DEVTOOLS", "GAMING", "SOCIAL", "EDUCATION", "FINTECH", "HEALTH", "ANY"] as const;
const IDEA_STATUSES = ["HAS_IDEA", "ROUGH_IDEAS", "JOIN_OTHER"] as const;
const SPRINT_GOALS = ["LEARN", "MEET_PEOPLE", "PORTFOLIO", "SHIP", "VALIDATE", "FUTURE_TEAM"] as const;
const TOTAL_STEPS = 4;

function toggleValue<T>(values: T[], value: T, max?: number) {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (max && values.length >= max) return values;
  return [...values, value];
}

function initialForm(participation: Participation, defaults: ProfileDefaults, crews: { id: string; label: string }[]): FormState {
  const existing = participation?.applicationData;
  return {
    role: existing?.role ?? defaults?.role ?? "FRONTEND",
    level: existing?.level ?? defaults?.level ?? "BUILDING",
    skills: existing?.skills?.slice(0, 5) ?? defaults?.skills?.slice(0, 5) ?? [],
    weeklyHours: existing?.weeklyHours ?? defaults?.weeklyHours ?? "3-5",
    workTimes: existing?.workTimes ?? [],
    seriousness: existing?.seriousness ?? "PORTFOLIO",
    projectThemes: existing?.projectThemes ?? [],
    ideaStatus: existing?.ideaStatus ?? "JOIN_OTHER",
    ideaDescription: existing?.ideaDescription ?? "",
    preferredRoles: existing?.preferredRoles ?? [],
    sprintGoals: existing?.sprintGoals ?? [],
    planningStyle: existing?.planningStyle ?? 3,
    paceStyle: existing?.paceStyle ?? 3,
    projectStyle: existing?.projectStyle ?? 3,
    commitmentAccepted: existing?.commitmentAccepted ?? false,
    mode: participation?.mode ?? "FIND_CREW",
    crewId: participation?.crewId ?? crews[0]?.id ?? "",
  };
}

export function ChallengeJoinPanel({
  challengeId,
  participation,
  crews,
  profileDefaults,
}: {
  challengeId: string;
  participation: Participation;
  crews: { id: string; label: string }[];
  profileDefaults: ProfileDefaults;
}) {
  const router = useRouter();
  const copy = useCopy();
  const locale = useLocale();
  const labels = labelsFor(locale);
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [editing, setEditing] = React.useState(!participation?.applicationData);
  const [skillDraft, setSkillDraft] = React.useState("");
  const [form, setForm] = React.useState<FormState>(() => initialForm(participation, profileDefaults, crews));

  const existing = participation?.applicationData;
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  function addSkill() {
    const value = skillDraft.trim();
    if (!value || form.skills.includes(value) || form.skills.length >= 5) return;
    setForm((current) => ({ ...current, skills: [...current.skills, value] }));
    setSkillDraft("");
  }

  const canContinue = React.useMemo(() => {
    if (step === 1) return Boolean(form.role && form.level && form.skills.length >= 1);
    if (step === 2) return Boolean(form.weeklyHours && form.workTimes.length >= 1 && form.seriousness);
    if (step === 3) return Boolean(
      form.projectThemes.length >= 1
      && form.ideaStatus
      && (form.ideaStatus !== "HAS_IDEA" || (form.ideaDescription?.trim().length ?? 0) >= 10),
    );
    return Boolean(
      form.sprintGoals.length >= 1
      && form.commitmentAccepted
      && (form.mode === "FIND_CREW" || Boolean(form.crewId)),
    );
  }, [form, step]);

  async function save() {
    if (!canContinue) return;
    setPending(true);
    const result = await joinChallenge({
      challengeId,
      mode: form.mode,
      crewId: form.mode === "HAS_CREW" ? form.crewId : "",
      application: {
        role: form.role,
        level: form.level,
        skills: form.skills,
        weeklyHours: form.weeklyHours,
        workTimes: form.workTimes,
        seriousness: form.seriousness,
        projectThemes: form.projectThemes,
        ideaStatus: form.ideaStatus,
        ideaDescription: form.ideaDescription ?? "",
        preferredRoles: form.preferredRoles,
        sprintGoals: form.sprintGoals,
        planningStyle: form.planningStyle,
        paceStyle: form.paceStyle,
        projectStyle: form.projectStyle,
        commitmentAccepted: true,
      },
    });
    setPending(false);
    if (result?.error) {
      toast.error(appMessage(result.error, locale));
      return;
    }
    toast.success(existing ? copy("Zgłoszenie zaktualizowane.", "Application updated.") : copy("Zgłoszenie przyjęte!", "Application received!"));
    setEditing(false);
    setStep(1);
    router.refresh();
  }

  async function leave() {
    setPending(true);
    const result = await leaveChallenge(challengeId);
    setPending(false);
    if (result?.error) toast.error(appMessage(result.error, locale));
    else {
      toast.success(copy("Wypisano ze Sprintu.", "You left the Sprint."));
      setEditing(true);
      router.refresh();
    }
  }

  if (existing && !editing) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--bc-line)] bg-[#f7f9ef] p-5 dark:bg-lime-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/40 bg-lime-300/40 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 dark:bg-lime-400/15 dark:text-lime-200">
                <Check className="h-3.5 w-3.5" /> {copy("Zgłoszenie przyjęte", "Application received")}
              </div>
              <h3 className="mt-3 text-xl font-semibold">{copy("Jesteś na liście kandydatów.", "You're on the applicant list.")}</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-500">{copy("Te dane wykorzystamy przy dobieraniu Twojej Crew.", "We'll use these answers when matching your Crew.")}</p>
            </div>
            <Sparkles className="h-5 w-5 text-[#8eb51f]" />
          </div>
        </div>
        <div className="grid gap-px bg-[var(--bc-line)] sm:grid-cols-2">
          <SummaryCell label={copy("Rola", "Role")} value={ROLE_LABELS[existing.role]} />
          <SummaryCell label={copy("Dostępność", "Availability")} value={COMMITMENT_LABELS[existing.weeklyHours]} />
          <SummaryCell label={copy("Stack", "Stack")} value={existing.skills.join(" · ")} />
          <SummaryCell label={copy("Tryb", "Mode")} value={participation?.mode === "HAS_CREW" ? copy("Mam Crew", "I have a Crew") : copy("Szukam Crew", "Find me a Crew")} />
        </div>
        <div className="p-5">
          <p className="text-sm font-medium">{copy("Co dalej?", "What's next?")}</p>
          <p className="mt-1 text-sm leading-6 text-neutral-500">{copy("Gdy pojawią się kolejne zgłoszenia, poniżej zobaczysz osoby z najwyższym dopasowaniem. Przed Team Reveal możesz w każdej chwili poprawić odpowiedzi.", "As more applications arrive, you'll see your best matches below. You can edit your answers any time before Team Reveal.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}>{copy("Edytuj zgłoszenie", "Edit application")}</Button>
            <Button variant="ghost" onClick={leave} disabled={pending}>{copy("Wycofaj zgłoszenie", "Withdraw")}</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--bc-line)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{copy(`Krok ${step} z ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`)}</p>
            <h3 className="mt-1 text-lg font-semibold">{stepTitle(step, locale)}</h3>
          </div>
          <span className="text-xs font-medium text-neutral-400">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-4 h-1.5" />
      </div>

      <div className="p-5">
        {step === 1 ? (
          <div className="space-y-6">
            <Field title={copy("Jaka jest Twoja główna rola?", "What's your main role?")} hint={copy("Wybierz to, co realnie wniesiesz do projektu.", "Choose what you'll realistically contribute to the project.")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROLE_OPTIONS.map((role) => <Choice key={role} selected={form.role === role} onClick={() => setForm({ ...form, role })}>{ROLE_LABELS[role]}</Choice>)}
              </div>
            </Field>

            <Field title={copy("Jaki masz poziom?", "What's your level?")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["LEARNING", "BUILDING", "EXPERIENCED"] as Level[]).map((level) => <Choice key={level} selected={form.level === level} onClick={() => setForm({ ...form, level })}>{labels.levels[level]}</Choice>)}
              </div>
            </Field>

            <Field title={copy("Najważniejsze umiejętności", "Core skills")} hint={copy("Dodaj od 1 do 5. Jeśli masz je na profilu, wypełniliśmy je za Ciebie.", "Add 1 to 5. We prefilled skills from your profile when possible.")}>
              <div className="flex gap-2">
                <input
                  list="sprint-skills"
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }}
                  placeholder={copy("np. React", "e.g. React")}
                  className="h-10 min-w-0 flex-1 rounded-[6px] border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-400/20 dark:border-neutral-700 dark:bg-neutral-900"
                />
                <datalist id="sprint-skills">{ALL_SKILLS.map((skill) => <option key={skill} value={skill} />)}</datalist>
                <Button type="button" variant="outline" onClick={addSkill} disabled={!skillDraft.trim() || form.skills.length >= 5}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.skills.map((skill) => <button key={skill} type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((item) => item !== skill) })} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">{skill}<X className="h-3 w-3" /></button>)}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <Field title={copy("Ile czasu REALNIE możesz dać tygodniowo?", "How much time can you REALISTICALLY give each week?")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COMMITMENT_OPTIONS.map((value) => <Choice key={value} selected={form.weeklyHours === value} onClick={() => setForm({ ...form, weeklyHours: value })}>{COMMITMENT_LABELS[value]}</Choice>)}
              </div>
            </Field>
            <Field title={copy("Kiedy najczęściej możesz działać?", "When can you usually work?")} hint={copy("Możesz zaznaczyć kilka opcji.", "You can select multiple options.")}>
              <div className="grid gap-2 sm:grid-cols-2">
                {WORK_TIMES.map((value) => <Choice key={value} selected={form.workTimes.includes(value)} onClick={() => setForm({ ...form, workTimes: toggleValue(form.workTimes, value) })}>{workTimeLabel(value, locale)}</Choice>)}
              </div>
            </Field>
            <Field title={copy("Jak poważnie podchodzisz do tego Sprintu?", "What do you want from this Sprint?")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {SERIOUSNESS.map((value) => <Choice key={value} selected={form.seriousness === value} onClick={() => setForm({ ...form, seriousness: value })}>{seriousnessLabel(value, locale)}</Choice>)}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <Field title={copy("Co najbardziej chcesz zbudować?", "What would you most like to build?")} hint={copy("Wybierz maksymalnie 3 obszary.", "Choose up to 3 areas.")}>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((value) => <Choice compact key={value} selected={form.projectThemes.includes(value)} onClick={() => setForm({ ...form, projectThemes: toggleValue(form.projectThemes, value, 3) })}>{themeLabel(value)}</Choice>)}
              </div>
            </Field>
            <Field title={copy("Masz już własny pomysł?", "Do you already have an idea?")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {IDEA_STATUSES.map((value) => <Choice key={value} selected={form.ideaStatus === value} onClick={() => setForm({ ...form, ideaStatus: value })}>{ideaLabel(value, locale)}</Choice>)}
              </div>
            </Field>
            {form.ideaStatus !== "JOIN_OTHER" ? (
              <Field title={form.ideaStatus === "HAS_IDEA" ? copy("Opisz pomysł w 2–3 zdaniach", "Describe the idea in 2–3 sentences") : copy("Jakie pomysły chodzą Ci po głowie?", "What kinds of ideas are you considering?")}>
                <textarea value={form.ideaDescription ?? ""} onChange={(event) => setForm({ ...form, ideaDescription: event.target.value })} maxLength={600} rows={4} className="w-full resize-none rounded-[6px] border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-400/20 dark:border-neutral-700 dark:bg-neutral-900" placeholder={copy("Krótko: problem, dla kogo i co miałoby powstać.", "Briefly: the problem, who it's for, and what you'd build.")} />
              </Field>
            ) : null}
            <Field title={copy("Z jakimi rolami najbardziej chcesz się połączyć?", "Which roles would you most like on your Crew?")} hint={copy("Opcjonalnie, maksymalnie 4.", "Optional, up to 4.")}>
              <div className="flex flex-wrap gap-2">{ROLE_OPTIONS.filter((role) => role !== form.role).map((role) => <Choice compact key={role} selected={form.preferredRoles.includes(role)} onClick={() => setForm({ ...form, preferredRoles: toggleValue(form.preferredRoles, role, 4) })}>{ROLE_LABELS[role]}</Choice>)}</div>
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <Field title={copy("Co jest dla Ciebie najważniejsze?", "What matters most to you?")} hint={copy("Wybierz maksymalnie 2 cele.", "Choose up to 2 goals.")}>
              <div className="grid gap-2 sm:grid-cols-2">{SPRINT_GOALS.map((value) => <Choice key={value} selected={form.sprintGoals.includes(value)} onClick={() => setForm({ ...form, sprintGoals: toggleValue(form.sprintGoals, value, 2) })}>{goalLabel(value, locale)}</Choice>)}</div>
            </Field>

            <div className="grid gap-5 rounded-[8px] border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
              <SliderField label={copy("Eksperymentować", "Experiment")} opposite={copy("Jasny plan", "Clear plan")} value={form.planningStyle} onChange={(value) => setForm({ ...form, planningStyle: value })} />
              <SliderField label={copy("Spokojne tempo", "Steady pace")} opposite={copy("Szybkie tempo", "Fast pace")} value={form.paceStyle} onChange={(value) => setForm({ ...form, paceStyle: value })} />
              <SliderField label={copy("Luźny side-project", "Casual side project")} opposite={copy("Poważny projekt", "Serious project")} value={form.projectStyle} onChange={(value) => setForm({ ...form, projectStyle: value })} />
            </div>

            <Field title={copy("Jak chcesz wystartować?", "How do you want to start?")}>
              <div className="grid gap-2 sm:grid-cols-2">
                <Choice selected={form.mode === "FIND_CREW"} onClick={() => setForm({ ...form, mode: "FIND_CREW" })}><span className="font-semibold">{copy("Znajdź mi ekipę", "Find me a Crew")}</span><span className="mt-1 block text-xs font-normal text-neutral-500">{copy("BuildCrew dobierze pasujące osoby.", "BuildCrew will suggest matching people.")}</span></Choice>
                <Choice disabled={!crews.length} selected={form.mode === "HAS_CREW"} onClick={() => crews.length && setForm({ ...form, mode: "HAS_CREW" })}><span className="font-semibold">{copy("Mam już Crew", "I already have a Crew")}</span><span className="mt-1 block text-xs font-normal text-neutral-500">{crews.length ? copy("Zapisz istniejącą ekipę.", "Register your existing team.") : copy("Nie należysz jeszcze do żadnej Crew.", "You don't belong to a Crew yet.")}</span></Choice>
              </div>
              {form.mode === "HAS_CREW" && crews.length ? <select className="mt-3 h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={form.crewId} onChange={(event) => setForm({ ...form, crewId: event.target.value })}>{crews.map((crew) => <option key={crew.id} value={crew.id}>{crew.label}</option>)}</select> : null}
            </Field>

            <div className="rounded-[8px] border border-neutral-200 p-4 dark:border-neutral-700">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{copy("Podsumowanie", "Summary")}</p>
              <p className="mt-2 text-sm font-semibold">{ROLE_LABELS[form.role]} · {labels.levels[form.level]}</p>
              <p className="mt-1 text-sm text-neutral-500">{form.skills.join(" · ")} · {COMMITMENT_LABELS[form.weeklyHours]}</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-neutral-200 p-4 text-sm leading-6 dark:border-neutral-700">
              <input type="checkbox" checked={form.commitmentAccepted} onChange={(event) => setForm({ ...form, commitmentAccepted: event.target.checked })} className="mt-1 h-4 w-4 accent-lime-500" />
              <span>{copy("Rozumiem, że Sprint wymaga aktywnego udziału przez cały okres programu i deklaruję realną dostępność podaną wyżej.", "I understand the Sprint requires active participation throughout the program and the availability above is realistic.")}</span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--bc-line)] p-5">
        <div>{step > 1 ? <Button variant="ghost" onClick={() => setStep((value) => value - 1)} disabled={pending}><ChevronLeft className="h-4 w-4" /> {copy("Wstecz", "Back")}</Button> : existing ? <Button variant="ghost" onClick={() => setEditing(false)}>{copy("Anuluj", "Cancel")}</Button> : null}</div>
        {step < TOTAL_STEPS ? <Button onClick={() => setStep((value) => value + 1)} disabled={!canContinue}>{copy("Dalej", "Continue")} <ChevronRight className="h-4 w-4" /></Button> : <Button onClick={save} disabled={!canContinue || pending}>{pending ? copy("Wysyłanie…", "Submitting…") : existing ? copy("Zapisz zmiany", "Save changes") : copy("Wyślij zgłoszenie", "Submit application")} <Sparkles className="h-4 w-4" /></Button>}
      </div>
    </Card>
  );
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <div><h4 className="text-sm font-semibold">{title}</h4>{hint ? <p className="mt-1 text-xs leading-5 text-neutral-500">{hint}</p> : null}<div className="mt-3">{children}</div></div>;
}

function Choice({ selected, onClick, disabled, compact, children }: { selected: boolean; onClick: () => void; disabled?: boolean; compact?: boolean; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={cn("relative rounded-[7px] border text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40", compact ? "px-3 py-2" : "min-h-12 p-3", selected ? "border-lime-500 bg-lime-300/45 font-medium text-neutral-950 ring-2 ring-lime-400/20 dark:bg-lime-400/15 dark:text-lime-100" : "border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500")}>{selected ? <Check className="absolute right-2 top-2 h-3.5 w-3.5" /> : null}<span className={selected ? "pr-4" : undefined}>{children}</span></button>;
}

function SliderField({ label, opposite, value, onChange }: { label: string; opposite: string; value: number; onChange: (value: number) => void }) {
  return <label className="block"><div className="mb-2 flex justify-between gap-4 text-xs text-neutral-500"><span>{label}</span><span>{opposite}</span></div><input type="range" min={1} max={5} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-lime-500" /></label>;
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-4 dark:bg-[#171715]"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p><p className="mt-1.5 text-sm font-medium">{value}</p></div>;
}

function stepTitle(step: number, locale: "pl" | "en") {
  const pl = ["", "Co wnosisz do zespołu?", "Jak chcesz pracować?", "Co chcesz zbudować?", "Dopasujmy Twoją Crew"];
  const en = ["", "What do you bring to the team?", "How do you want to work?", "What do you want to build?", "Let's match your Crew"];
  return (locale === "en" ? en : pl)[step];
}
function workTimeLabel(value: (typeof WORK_TIMES)[number], locale: "pl" | "en") { const pl = { WEEKDAY_MORNING: "W tygodniu rano", WEEKDAY_EVENING: "W tygodniu wieczorem", WEEKENDS: "Weekendy", FLEXIBLE: "Elastycznie" }; const en = { WEEKDAY_MORNING: "Weekday mornings", WEEKDAY_EVENING: "Weekday evenings", WEEKENDS: "Weekends", FLEXIBLE: "Flexible" }; return (locale === "en" ? en : pl)[value]; }
function seriousnessLabel(value: (typeof SERIOUSNESS)[number], locale: "pl" | "en") { const pl = { LEARN: "Chcę się głównie nauczyć", PORTFOLIO: "Chcę dowieźć projekt do portfolio", SHIP: "Chcę zbudować coś do dalszego rozwoju" }; const en = { LEARN: "Mainly learn", PORTFOLIO: "Ship a portfolio project", SHIP: "Build something worth continuing" }; return (locale === "en" ? en : pl)[value]; }
function themeLabel(value: (typeof THEMES)[number]) { return ({ SAAS: "SaaS", AI: "AI", MOBILE: "Mobile", WEB: "Web", DEVTOOLS: "Developer Tools", GAMING: "Gaming", SOCIAL: "Social", EDUCATION: "Education", FINTECH: "FinTech", HEALTH: "Health", ANY: "Bez preferencji" } as const)[value]; }
function ideaLabel(value: (typeof IDEA_STATUSES)[number], locale: "pl" | "en") { const pl = { HAS_IDEA: "Tak, mam konkretny pomysł", ROUGH_IDEAS: "Mam kilka luźnych pomysłów", JOIN_OTHER: "Nie - chcę dołączyć do czyjegoś" }; const en = { HAS_IDEA: "Yes, I have a clear idea", ROUGH_IDEAS: "I have a few rough ideas", JOIN_OTHER: "No - I want to join someone else's" }; return (locale === "en" ? en : pl)[value]; }
function goalLabel(value: (typeof SPRINT_GOALS)[number], locale: "pl" | "en") { const pl = { LEARN: "Nauczyć się nowych rzeczy", MEET_PEOPLE: "Poznać ludzi", PORTFOLIO: "Zbudować portfolio", SHIP: "Wypuścić działający produkt", VALIDATE: "Sprawdzić pomysł biznesowy", FUTURE_TEAM: "Znaleźć przyszłych współpracowników" }; const en = { LEARN: "Learn new things", MEET_PEOPLE: "Meet people", PORTFOLIO: "Build my portfolio", SHIP: "Ship a working product", VALIDATE: "Validate a business idea", FUTURE_TEAM: "Find future collaborators" }; return (locale === "en" ? en : pl)[value]; }
