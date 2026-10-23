"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LOOKING_FOR_OPTIONS } from "@/lib/constants";
import type { LookingFor, ProfileDiscipline, RoleType } from "@/db/schema";
import { completeOnboarding } from "@/server/actions/profile";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import {
  PROFILE_DISCIPLINES,
  disciplineCopy,
  roleOptionsForDisciplines,
  skillsForDisciplines,
} from "@/lib/profile-disciplines";

const TOTAL_STEPS = 3;
const DRAFT_KEY = "buildcrew-onboarding-quick-v1";
const LEGACY_DRAFT_KEYS = [
  "buildcrew-onboarding-draft-v4",
  "buildcrew-onboarding-draft-v3",
  "buildcrew-onboarding-draft-v2",
];
const MAX_SKILLS = 8;

type FormState = {
  username: string;
  disciplines: ProfileDiscipline[];
  role: RoleType | "";
  skills: string[];
  lookingFor: LookingFor[];
};

type StoredDraft = { version: 1; step: number; form: FormState; updatedAt: string };

const emptyForm: FormState = {
  username: "",
  disciplines: [],
  role: "",
  skills: [],
  lookingFor: [],
};

function normalizeStep(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(TOTAL_STEPS, Math.max(1, Math.round(parsed)));
}

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

export function OnboardingWizard() {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const disciplineLabels = disciplineCopy(locale);
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [draftReady, setDraftReady] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const roleOptions = React.useMemo(() => roleOptionsForDisciplines(form.disciplines), [form.disciplines]);
  const skillOptions = React.useMemo(() => skillsForDisciplines(form.disciplines), [form.disciplines]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredDraft>;
        if (parsed.form) {
          setForm({ ...emptyForm, ...parsed.form });
          setStep(normalizeStep(parsed.step));
          return;
        }
      }

      for (const key of LEGACY_DRAFT_KEYS) {
        const legacyRaw = window.localStorage.getItem(key);
        if (!legacyRaw) continue;
        const parsed = JSON.parse(legacyRaw) as { form?: Partial<FormState> } & Partial<FormState>;
        const legacyForm = parsed.form ?? parsed;
        setForm({
          ...emptyForm,
          username: legacyForm.username ?? "",
          disciplines: legacyForm.disciplines ?? [],
          role: legacyForm.role ?? "",
          skills: legacyForm.skills ?? [],
          lookingFor: legacyForm.lookingFor ?? [],
        });
        break;
      }
    } catch {
      // A broken local draft should never block onboarding.
    } finally {
      setDraftReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (!form.disciplines.length) return;
    if (form.role && roleOptions.includes(form.role)) return;
    setForm((current) => ({ ...current, role: roleOptions.length === 1 ? roleOptions[0] : "" }));
  }, [form.disciplines, form.role, roleOptions]);

  React.useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(() => {
      try {
        const draft: StoredDraft = { version: 1, step, form, updatedAt: new Date().toISOString() };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // localStorage may be unavailable in private browsing.
      }
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [draftReady, form, step]);

  const canProceed = React.useMemo(() => {
    if (step === 1) {
      return form.username.trim().length >= 2
        && /^[a-zA-Z0-9_]+$/.test(form.username.trim())
        && form.disciplines.length >= 1
        && form.disciplines.length <= 2;
    }
    if (step === 2) return Boolean(form.role) && form.skills.length >= 1;
    return form.lookingFor.length >= 1;
  }, [form, step]);

  function toggleDiscipline(discipline: ProfileDiscipline) {
    setForm((current) => {
      if (current.disciplines.includes(discipline)) {
        return {
          ...current,
          disciplines: current.disciplines.filter((item) => item !== discipline),
          skills: [],
        };
      }
      if (current.disciplines.length >= 2) {
        toast.message(copy("Możesz wybrać maksymalnie 2 obszary.", "You can choose up to 2 areas."));
        return current;
      }
      return { ...current, disciplines: [...current.disciplines, discipline] };
    });
  }

  function toggleSkill(skill: string) {
    setForm((current) => {
      if (current.skills.includes(skill)) return { ...current, skills: current.skills.filter((item) => item !== skill) };
      if (current.skills.length >= MAX_SKILLS) {
        toast.message(copy(`Na start wybierz maksymalnie ${MAX_SKILLS}. Resztę dodasz w profilu.`, `Choose up to ${MAX_SKILLS} for now. Add the rest from your profile.`));
        return current;
      }
      return { ...current, skills: [...current.skills, skill] };
    });
  }

  async function handleSubmit() {
    setPending(true);
    try {
      const result = await completeOnboarding({
        username: form.username.trim(),
        disciplines: form.disciplines,
        role: form.role as RoleType,
        skills: form.skills,
        lookingFor: form.lookingFor,
      });

      if (result?.error) {
        toast.error(appMessage(result.error, locale));
        setPending(false);
      }
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_REDIRECT")) {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
          LEGACY_DRAFT_KEYS.forEach((key) => window.localStorage.removeItem(key));
        } catch {}
        throw err;
      }
      setPending(false);
      toast.error(copy("Nie udało się zapisać profilu. Spróbuj ponownie.", "We couldn't save your profile. Please try again."));
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
        <div className="mb-2 flex items-center justify-between gap-4 text-[12px] text-[var(--bc-muted)]">
          <span>{copy(`Krok ${step} z ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`)}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div className="rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 sm:p-7">
        {step === 1 ? (
          <StepShell
            title={copy("Zacznijmy od podstaw", "Let's start with the basics")}
            subtitle={copy("Wybierz 1 lub 2 obszary, w których działasz. To wystarczy, żeby wejść do BuildCrew i zacząć odkrywać ludzi oraz projekty.", "Choose 1 or 2 areas you work in. That's enough to enter BuildCrew and start discovering people and projects.")}
          >
            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <Label htmlFor="username">{copy("Nick", "Username")}</Label>
                <Input
                  id="username"
                  className="mt-2"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder={copy("np. CodePanda", "e.g. CodePanda")}
                  autoFocus
                />
                <p className="mt-2 text-[11px] leading-4 text-[var(--bc-faint)]">
                  {copy("Litery, cyfry i podkreślenia. Nick będzie publiczny.", "Letters, numbers and underscores. Your username will be public.")}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label>{copy("Czym się zajmujesz?", "What do you do?")}</Label>
                  <span className="text-[11px] text-[var(--bc-faint)]">{form.disciplines.length}/2</span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PROFILE_DISCIPLINES.map((discipline) => (
                    <DisciplineTile
                      key={discipline}
                      active={form.disciplines.includes(discipline)}
                      title={disciplineLabels[discipline].label}
                      description={disciplineLabels[discipline].description}
                      onClick={() => toggleDiscipline(discipline)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            title={copy("Co potrafisz?", "What can you do?")}
            subtitle={copy("Wybierz główną specjalizację i kilka umiejętności. Nie musisz teraz budować pełnego profilu - wystarczy to, co najlepiej Cię opisuje.", "Choose your main specialization and a few skills. You don't need to build a full profile now - just add what describes you best.")}
          >
            <div className="grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <Label>{copy("Główna specjalizacja", "Primary specialization")}</Label>
                <div className="mt-2 grid gap-2">
                  {roleOptions.map((role) => (
                    <SelectableTile
                      key={role}
                      active={form.role === role}
                      label={labels.roles[role]}
                      onClick={() => setForm((current) => ({ ...current, role }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label>{copy("Umiejętności / technologie", "Skills / technologies")}</Label>
                  <span className="text-[11px] text-[var(--bc-faint)]">{form.skills.length}/{MAX_SKILLS}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">
                  {copy("Wybierz 3–5, jeśli możesz. Minimum jedna - resztę uzupełnisz później.", "Choose 3–5 if you can. One is enough for now - complete the rest later.")}
                </p>
                <div className="mt-3 flex max-h-[430px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
                  {skillOptions.map((skill) => (
                    <TagToggle key={skill} active={form.skills.includes(skill)} label={skill} onClick={() => toggleSkill(skill)} />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            title={copy("Po co jesteś na BuildCrew?", "What brings you to BuildCrew?")}
            subtitle={copy("Wybierz to, czego szukasz teraz. Dzięki temu od pierwszego wejścia pokażemy Ci sensowniejszych ludzi i projekty.", "Choose what you're looking for right now. This helps us show you more relevant people and projects from your first visit.")}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <CheckTile
                  key={option}
                  checked={form.lookingFor.includes(option)}
                  label={labels.lookingFor[option]}
                  onChange={() => setForm((current) => ({ ...current, lookingFor: toggleValue(current.lookingFor, option) }))}
                />
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--bc-line)] pt-5">
              <p className="text-[13px] font-medium text-[var(--bc-ink)]">
                {copy("To wszystko na start.", "That's all for now.")}
              </p>
              <p className="mt-1 max-w-[620px] text-[12px] leading-5 text-[var(--bc-muted)]">
                {copy("Po wejściu do BuildCrew możesz spokojnie dodać bio, poziom doświadczenia, dostępność, lokalizację, linki i portfolio. Będziemy podpowiadać, co warto uzupełnić - bez blokowania korzystania z platformy.", "Once you're inside BuildCrew, you can add your bio, experience, availability, location, links and portfolio. We'll suggest what is worth completing without blocking the product.")}
              </p>
            </div>
          </StepShell>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>{copy("Wstecz", "Back")}</Button>
        <Button onClick={next} disabled={!canProceed || pending}>
          {pending
            ? copy("Wchodzimy do BuildCrew…", "Entering BuildCrew…")
            : step === TOTAL_STEPS
              ? copy("Wejdź do BuildCrew", "Enter BuildCrew")
              : copy("Dalej", "Next")}
        </Button>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-[690px]">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-[var(--bc-muted)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function DisciplineTile({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative min-h-[82px] rounded-[var(--bc-radius-sm)] border p-3.5 text-left transition-[background-color,border-color,box-shadow]",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] ring-1 ring-[var(--bc-accent-strong)]"
          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
      )}
    >
      {active ? <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#1c1b17] text-[var(--bc-accent)]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span> : null}
      <span className="block pr-7 text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-[11px] leading-4 text-[var(--bc-muted)]">{description}</span>
    </button>
  );
}

function SelectableTile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative min-h-11 rounded-[var(--bc-radius-sm)] border px-3 py-2.5 text-center text-sm font-medium transition-[background-color,border-color,box-shadow]",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950 ring-1 ring-[var(--bc-accent-strong)]"
          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
      )}
    >
      {active ? <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#1c1b17] text-[var(--bc-accent)]"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span> : null}
      {label}
    </button>
  );
}

function TagToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-[var(--bc-radius-sm)] border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950"
          : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]",
      )}
    >
      {label}
    </button>
  );
}

function CheckTile({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-[var(--bc-radius-sm)] border px-3 py-2.5 text-left transition-colors",
        checked
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]"
          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
      )}
    >
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border", checked ? "border-[#1c1b17] bg-[#1c1b17] text-[var(--bc-accent)]" : "border-[var(--bc-line-strong)]")}>{checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
