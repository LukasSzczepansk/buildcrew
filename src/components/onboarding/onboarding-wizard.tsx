"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  COMMITMENT_LABELS,
  COMMITMENT_OPTIONS,
  GOAL_LABELS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  LEVEL_DESCRIPTIONS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  LOOKING_FOR_LABELS,
  LOOKING_FOR_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  SKILL_GROUPS,
} from "@/lib/constants";
import type { Commitment, Goal, Level, LookingFor, RoleType } from "@/db/schema";
import { completeOnboarding } from "@/server/actions/profile";

type FormState = {
  username: string;
  role: RoleType | "";
  skills: string[];
  level: Level | "";
  interests: string[];
  weeklyHours: Commitment | "";
  goals: Goal[];
  lookingFor: LookingFor[];
  githubUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  discordUsername: string;
};

const TOTAL_STEPS = 5;
const DRAFT_KEY = "buildcrew-onboarding-draft-v2";

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const emptyForm: FormState = {
  username: "",
  role: "",
  skills: [],
  level: "",
  interests: [],
  weeklyHours: "",
  goals: [],
  lookingFor: [],
  githubUrl: "",
  portfolioUrl: "",
  linkedinUrl: "",
  discordUsername: "",
};

export function OnboardingWizard() {
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [draftReady, setDraftReady] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        setForm({ ...emptyForm, ...parsed });
      }
    } catch {
      // Nie blokujemy onboardingu, jeśli lokalny szkic jest uszkodzony.
    } finally {
      setDraftReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        // LocalStorage może być niedostępny w trybie prywatnym.
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftReady, form]);

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.username.trim().length >= 2 && /^[a-zA-Z0-9_]+$/.test(form.username.trim()) && !!form.role;
      case 2:
        return form.skills.length >= 1 && !!form.level;
      case 3:
        return !!form.weeklyHours && form.lookingFor.length >= 1;
      default:
        return true;
    }
  }, [step, form]);

  async function handleSubmit() {
    setPending(true);
    try {
      const result = await completeOnboarding({
        username: form.username.trim(),
        role: form.role as RoleType,
        skills: form.skills,
        level: form.level as Level,
        interests: form.interests,
        weeklyHours: form.weeklyHours as Commitment,
        goals: form.goals,
        lookingFor: form.lookingFor,
        githubUrl: form.githubUrl,
        portfolioUrl: form.portfolioUrl,
        linkedinUrl: form.linkedinUrl,
        discordUsername: form.discordUsername,
      });

      if (result?.error) {
        toast.error(result.error);
        setPending(false);
      }
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_REDIRECT")) {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // Bez wpływu na zapis profilu.
        }
        throw err;
      }
      setPending(false);
      toast.error("Nie udało się zapisać profilu. Spróbuj ponownie.");
    }
  }

  function next() {
    if (step === TOTAL_STEPS) {
      void handleSubmit();
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-[12px] text-[var(--bc-muted)]">
          <span>Krok {step} z {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 sm:p-7">
        {step === 1 ? (
          <StepShell title="Podstawy" subtitle="Nick i główna rola wystarczą, żeby zacząć budować pierwsze dopasowania.">
            <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:items-start">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Nick</Label>
                <Input
                  id="username"
                  placeholder="np. CodePanda"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  autoFocus
                />
                <p className="text-[11px] leading-4 text-[var(--bc-faint)]">Litery, cyfry i podkreślenia. Nick będzie publiczny.</p>
              </div>

              <div>
                <Label>Główna rola</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ROLE_OPTIONS.map((role) => (
                    <SelectableTile key={role} active={form.role === role} label={ROLE_LABELS[role]} onClick={() => setForm((current) => ({ ...current, role }))} />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell title="Umiejętności" subtitle="Wybierz technologie, z którymi rzeczywiście chcesz pracować, i określ swój poziom.">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="max-h-[430px] space-y-4 overflow-y-auto pr-1">
                {Object.entries(SKILL_GROUPS).map(([group, list]) => (
                  <div key={group}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((skill) => (
                        <TagToggle key={skill} active={form.skills.includes(skill)} label={skill} onClick={() => setForm((current) => ({ ...current, skills: toggleValue(current.skills, skill) }))} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <Label>Poziom</Label>
                <div className="mt-2 space-y-2">
                  {LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, level }))}
                      className={cn(
                        "w-full rounded-[6px] border px-3 py-3 text-left transition-colors",
                        form.level === level
                          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]"
                          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]",
                      )}
                    >
                      <p className="text-[13px] font-medium">{LEVEL_LABELS[level]}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-[var(--bc-muted)]">{LEVEL_DESCRIPTIONS[level]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell title="Czas i intencja" subtitle="To są jedne z najmocniejszych sygnałów dopasowania w BuildCrew.">
            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <Label>Ile czasu masz tygodniowo?</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {COMMITMENT_OPTIONS.map((commitment) => (
                    <SelectableTile
                      key={commitment}
                      active={form.weeklyHours === commitment}
                      label={COMMITMENT_LABELS[commitment]}
                      onClick={() => setForm((current) => ({ ...current, weeklyHours: commitment }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Czego szukasz teraz?</Label>
                <div className="mt-2 space-y-2">
                  {LOOKING_FOR_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 transition-colors",
                        form.lookingFor.includes(option)
                          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]"
                          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]",
                      )}
                    >
                      <Checkbox checked={form.lookingFor.includes(option)} onCheckedChange={() => setForm((current) => ({ ...current, lookingFor: toggleValue(current.lookingFor, option) }))} />
                      <span className="text-[13px] font-medium">{LOOKING_FOR_LABELS[option]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell title="Co chcesz budować" subtitle="Opcjonalne, ale pomaga odróżnić przypadkowe profile od osób, z którymi naprawdę warto porozmawiać.">
            <div className="space-y-7">
              <div>
                <Label>Zainteresowania</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <TagToggle key={interest} active={form.interests.includes(interest)} label={interest} onClick={() => setForm((current) => ({ ...current, interests: toggleValue(current.interests, interest) }))} />
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5">
                <Label>Po co chcesz budować?</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => (
                    <TagToggle key={goal} active={form.goals.includes(goal)} label={GOAL_LABELS[goal]} onClick={() => setForm((current) => ({ ...current, goals: toggleValue(current.goals, goal) }))} />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell title="Kontakt i podgląd" subtitle="Linki są opcjonalne. Możesz uzupełnić je później w profilu.">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="github" label="GitHub" placeholder="https://github.com/twojnick" value={form.githubUrl} onChange={(value) => setForm((current) => ({ ...current, githubUrl: value }))} />
                <Field id="portfolio" label="Portfolio" placeholder="https://twojaportfolio.pl" value={form.portfolioUrl} onChange={(value) => setForm((current) => ({ ...current, portfolioUrl: value }))} />
                <Field id="linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/twojnick" value={form.linkedinUrl} onChange={(value) => setForm((current) => ({ ...current, linkedinUrl: value }))} />
                <Field id="discord" label="Discord" placeholder="np. codepanda123" value={form.discordUsername} onChange={(value) => setForm((current) => ({ ...current, discordUsername: value }))} hint="Prywatny. Udostępniamy go tylko w odpowiednim flow kontaktu." />
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Twój profil</p>
                <p className="mt-2 text-[18px] font-semibold tracking-[-0.02em]">{form.username || "Twój nick"}</p>
                <p className="mt-1 text-[13px] text-[var(--bc-muted)]">{form.role ? ROLE_LABELS[form.role] : "Wybierz rolę"}{form.level ? ` · ${LEVEL_LABELS[form.level]}` : ""}</p>
                <div className="mt-4 space-y-2 text-[12px] leading-5 text-[var(--bc-muted)]">
                  <p><span className="font-medium text-[var(--bc-ink)]">Umiejętności:</span> {form.skills.slice(0, 6).join(" · ") || "brak"}</p>
                  <p><span className="font-medium text-[var(--bc-ink)]">Czas:</span> {form.weeklyHours ? COMMITMENT_LABELS[form.weeklyHours] : "brak"}</p>
                  <p><span className="font-medium text-[var(--bc-ink)]">Szukasz:</span> {form.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).join(" · ") || "brak"}</p>
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>Wstecz</Button>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-[var(--bc-faint)] sm:inline">Szkic zapisuje się automatycznie.</span>
          <Button onClick={next} disabled={!canProceed || pending}>
            {pending ? "Szukamy dopasowań…" : step === TOTAL_STEPS ? "Zapisz i pokaż dopasowania" : "Dalej"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-[650px]">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ id, label, placeholder, value, onChange, hint }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint ? <p className="text-[11px] leading-4 text-[var(--bc-faint)]">{hint}</p> : null}
    </div>
  );
}

function SelectableTile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-[6px] border px-3 py-2.5 text-center text-[13px] font-medium transition-colors",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]"
          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]",
      )}
    >
      {label}
    </button>
  );
}

function TagToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]"
          : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]",
      )}
    >
      {label}
    </button>
  );
}
