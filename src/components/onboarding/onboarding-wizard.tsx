"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
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
import type { Commitment, Goal, Level, LookingFor, RoleType, WorkModePreference } from "@/db/schema";
import { completeOnboarding } from "@/server/actions/profile";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, WORK_MODE_OPTIONS, internationalLabels } from "@/lib/international";
import { countryLabel } from "@/lib/countries";

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
  headline: string;
  country: string;
  city: string;
  languages: string[];
  workModePreference: WorkModePreference;
};

const TOTAL_STEPS = 5;
const DRAFT_KEY = "buildcrew-onboarding-draft-v3";
const LEGACY_DRAFT_KEY = "buildcrew-onboarding-draft-v2";

type StoredDraft = {
  version: 3;
  step: number;
  form: FormState;
  updatedAt: string;
};

function normalizeStep(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(TOTAL_STEPS, Math.max(1, Math.round(parsed)));
}

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
  headline: "",
  country: "",
  city: "",
  languages: [],
  workModePreference: "FLEXIBLE",
};

export function OnboardingWizard() {
  const router = useRouter();
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [draftReady, setDraftReady] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredDraft>;
        if (parsed.form) {
          setForm({ ...emptyForm, ...parsed.form });
          setStep(normalizeStep(parsed.step));
          setSavedAt(typeof parsed.updatedAt === "string" ? parsed.updatedAt : null);
          return;
        }
      }

      // Migracja szkicu z poprzedniej wersji onboardingu.
      const legacyRaw = window.localStorage.getItem(LEGACY_DRAFT_KEY);
      if (legacyRaw) {
        const legacyForm = JSON.parse(legacyRaw) as Partial<FormState>;
        setForm({ ...emptyForm, ...legacyForm });
      }
    } catch {
      // Nie blokujemy onboardingu, jeśli lokalny szkic jest uszkodzony.
    } finally {
      setForm((current) => current.languages.length ? current : {
        ...current,
        languages: ["English"],
      });
      setDraftReady(true);
    }
  }, [locale]);

  const saveDraftNow = React.useCallback(() => {
    if (!draftReady) return;
    const updatedAt = new Date().toISOString();
    const draft: StoredDraft = { version: 3, step, form, updatedAt };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      window.localStorage.removeItem(LEGACY_DRAFT_KEY);
      setSavedAt(updatedAt);
    } catch {
      // LocalStorage może być niedostępny w trybie prywatnym.
    }
  }, [draftReady, form, step]);

  React.useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(saveDraftNow, 250);
    return () => window.clearTimeout(timeout);
  }, [draftReady, saveDraftNow]);

  React.useEffect(() => {
    if (!draftReady) return;
    const handlePageHide = () => saveDraftNow();
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [draftReady, saveDraftNow]);

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.username.trim().length >= 2 && /^[a-zA-Z0-9_]+$/.test(form.username.trim()) && !!form.role;
      case 2:
        return form.skills.length >= 1 && !!form.level;
      case 3:
        return !!form.weeklyHours && form.lookingFor.length >= 1;
      case 4:
        return form.languages.length >= 1;
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
        headline: form.headline,
        country: form.country,
        city: form.city,
        languages: form.languages,
        workModePreference: form.workModePreference,
      });

      if (result?.error) {
        toast.error(appMessage(result.error, locale));
        setPending(false);
      }
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith?.("NEXT_REDIRECT")) {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
          window.localStorage.removeItem(LEGACY_DRAFT_KEY);
        } catch {
          // Bez wpływu na zapis profilu.
        }
        throw err;
      }
      setPending(false);
      toast.error(copy("Nie udało się zapisać profilu. Spróbuj ponownie.", "We couldn’t save your profile. Please try again."));
    }
  }

  function exitOnboarding() {
    saveDraftNow();
    router.push("/");
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
        <div className="mb-2 flex items-center justify-between gap-4 text-[13px] text-[var(--bc-muted)]">
          <span>{copy(`Step ${step} of ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`)}</span>
          <div className="flex items-center gap-3">
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
            <button
              type="button"
              onClick={exitOnboarding}
              className="font-medium text-[var(--bc-muted)] underline-offset-4 transition-colors hover:text-[var(--bc-ink)] hover:underline"
            >
              {copy("Dokończ później", "Finish later")}
            </button>
          </div>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
        <p className="mt-2 text-[12px] leading-4 text-[var(--bc-faint)]">
          {copy("Postęp zapisuje się automatycznie na tym urządzeniu. Możesz wyjść, odświeżyć stronę i wrócić do tego samego kroku.", "Your progress is saved automatically on this device. You can leave, refresh the page and return to the same step.")}
        </p>
      </div>

      <div className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 sm:p-7">
        {step === 1 ? (
          <StepShell title={copy("Podstawy", "Basics")} subtitle={copy("Nick i główna rola wystarczą, żeby zacząć budować pierwsze dopasowania.", "A username and primary role are enough to start building your first matches.")}>
            <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:items-start">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">{copy("Nick", "Username")}</Label>
                <Input
                  id="username"
                  placeholder={copy("np. CodePanda", "e.g. CodePanda")}
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  autoFocus
                />
                <p className="text-[12px] leading-4 text-[var(--bc-faint)]">{copy("Litery, cyfry i podkreślenia. Nick będzie publiczny.", "Letters, numbers and underscores. Your username will be public.")}</p>
              </div>

              <div>
                <Label>{copy("Główna rola", "Primary role")}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ROLE_OPTIONS.map((role) => (
                    <SelectableTile key={role} active={form.role === role} label={labels.roles[role]} onClick={() => setForm((current) => ({ ...current, role }))} />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell title={copy("Umiejętności", "Skills")} subtitle={copy("Wybierz technologie, z którymi rzeczywiście chcesz pracować, i określ swój poziom.", "Choose the technologies you actually want to work with and set your experience level.")}>
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="max-h-[430px] space-y-4 overflow-y-auto pr-1">
                {Object.entries(SKILL_GROUPS).map(([group, list]) => (
                  <div key={group}>
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy(group === "Integracje" ? "Integrations" : group, group === "Integracje" ? "Integrations" : group)}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((skill) => (
                        <TagToggle key={skill} active={form.skills.includes(skill)} label={skill} onClick={() => setForm((current) => ({ ...current, skills: toggleValue(current.skills, skill) }))} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <Label>{copy("Poziom", "Level")}</Label>
                <div className="mt-2 space-y-2">
                  {LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, level }))}
                      aria-pressed={form.level === level}
                      className={cn(
                        "relative w-full rounded-[6px] border px-3 py-3 pr-10 text-left transition-[background-color,border-color,color,box-shadow]",
                        form.level === level
                          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950 ring-2 ring-[var(--bc-accent-strong)] ring-offset-1 ring-offset-[var(--bc-surface)]"
                          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
                      )}
                    >
                      {form.level === level ? (
                        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-neutral-950 text-[var(--bc-accent)]" aria-hidden="true">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                      <p className="text-sm font-medium">{labels.levels[level]}</p>
                      <p className={cn("mt-0.5 text-[12px] leading-4", form.level === level ? "text-neutral-700" : "text-[var(--bc-muted)]")}>{labels.levelDescriptions[level]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell title="Availability and opportunities" subtitle="Tell BuildCrew how much time you have and what kinds of people, projects or work opportunities you want to discover.">
            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <Label>{copy("Ile czasu masz tygodniowo?", "How much time do you have each week?")}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {COMMITMENT_OPTIONS.map((commitment) => (
                    <SelectableTile
                      key={commitment}
                      active={form.weeklyHours === commitment}
                      label={labels.commitments[commitment]}
                      onClick={() => setForm((current) => ({ ...current, weeklyHours: commitment }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>What are you open to right now?</Label>
                <div className="mt-2 space-y-2">
                  {LOOKING_FOR_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 transition-colors",
                        form.lookingFor.includes(option)
                          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] ring-2 ring-[var(--bc-accent-strong)] ring-offset-1 ring-offset-[var(--bc-surface)]"
                          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
                      )}
                    >
                      <Checkbox checked={form.lookingFor.includes(option)} onCheckedChange={() => setForm((current) => ({ ...current, lookingFor: toggleValue(current.lookingFor, option) }))} />
                      <span className="text-sm font-medium">{labels.lookingFor[option]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell title={copy("Jak chcesz współpracować", "How do you want to collaborate?")} subtitle={copy("Język, lokalizacja i tryb pracy pomagają uniknąć dopasowań, które od początku nie mają szans zadziałać.", "Language, location and work mode help avoid matches that were never going to work.")}>
            <div className="space-y-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{copy("Języki współpracy", "Collaboration languages")}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <TagToggle key={language} active={form.languages.includes(language)} label={language} onClick={() => setForm((current) => ({ ...current, languages: toggleValue(current.languages, language) }))} />
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--bc-faint)]">{copy("Wybierz co najmniej jeden język, w którym możesz pracować z zespołem.", "Choose at least one language you can use with a team.")}</p>
                </div>
                <div>
                  <Label>{copy("Preferowany tryb pracy", "Preferred work mode")}</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {WORK_MODE_OPTIONS.map((mode) => (
                      <SelectableTile key={mode} active={form.workModePreference === mode} label={intl.workMode[mode]} onClick={() => setForm((current) => ({ ...current, workModePreference: mode }))} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{copy("Kraj", "Country")}</Label>
                  <select value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="mt-2 h-10 w-full rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]">
                    <option value="">{copy("Wybierz kraj", "Select country")}</option>
                    {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{countryLabel(country)}</option>)}
                  </select>
                </div>
                <div>
                  <Label>{copy("Miasto (opcjonalnie)", "City (optional)")}</Label>
                  <Input className="mt-2" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder={copy("np. Warszawa", "e.g. Amsterdam")} />
                </div>
              </div>

              <div>
                <Label>{copy("Headline (opcjonalnie)", "Headline (optional)")}</Label>
                <Input className="mt-2" value={form.headline} onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))} maxLength={100} placeholder={copy("np. Full-stack developer budujący SaaS-y", "e.g. Full-stack developer building SaaS products")} />
              </div>
              <div>
                <Label>{copy("Zainteresowania", "Interests")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <TagToggle key={interest} active={form.interests.includes(interest)} label={interest} onClick={() => setForm((current) => ({ ...current, interests: toggleValue(current.interests, interest) }))} />
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5">
                <Label>{copy("Po co chcesz budować?", "Why do you want to build?")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => (
                    <TagToggle key={goal} active={form.goals.includes(goal)} label={labels.goals[goal]} onClick={() => setForm((current) => ({ ...current, goals: toggleValue(current.goals, goal) }))} />
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell title={copy("Kontakt i podgląd", "Links and preview")} subtitle={copy("Linki są opcjonalne. Możesz uzupełnić je później w profilu.", "Links are optional. You can add them later in your profile.")}>
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="github" label="GitHub" placeholder="https://github.com/yourname" value={form.githubUrl} onChange={(value) => setForm((current) => ({ ...current, githubUrl: value }))} />
                <Field id="portfolio" label="Portfolio" placeholder="https://yourportfolio.com" value={form.portfolioUrl} onChange={(value) => setForm((current) => ({ ...current, portfolioUrl: value }))} />
                <Field id="linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/yourname" value={form.linkedinUrl} onChange={(value) => setForm((current) => ({ ...current, linkedinUrl: value }))} />
                <Field id="discord" label="Discord" placeholder={copy("np. codepanda123", "e.g. codepanda123")} value={form.discordUsername} onChange={(value) => setForm((current) => ({ ...current, discordUsername: value }))} hint={copy("Prywatny. Udostępniamy go tylko w odpowiednim flow kontaktu.", "Private. We only share it in the appropriate contact flow.")} />
              </div>

              <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Twój profil", "Your profile")}</p>
                <p className="mt-2 text-[18px] font-semibold tracking-[-0.02em]">{form.username || copy("Twój nick", "Your username")}</p>
                <p className="mt-1 text-sm text-[var(--bc-muted)]">{form.role ? labels.roles[form.role] : copy("Wybierz rolę", "Choose a role")}{form.level ? ` · ${labels.levels[form.level]}` : ""}</p>
                <div className="mt-4 space-y-2 text-[13px] leading-5 text-[var(--bc-muted)]">
                  <p><span className="font-medium text-[var(--bc-ink)]">{copy("Umiejętności:", "Skills:")}</span> {form.skills.slice(0, 6).join(" · ") || copy("brak", "none")}</p>
                  <p><span className="font-medium text-[var(--bc-ink)]">{copy("Czas:", "Time:")}</span> {form.weeklyHours ? labels.commitments[form.weeklyHours] : copy("brak", "none")}</p>
                  <p><span className="font-medium text-[var(--bc-ink)]">Open to:</span> {form.lookingFor.map((item) => labels.lookingFor[item]).join(" · ") || copy("brak", "none")}</p>
                </div>
              </div>
            </div>
          </StepShell>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>{copy("Wstecz", "Back")}</Button>
        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] text-[var(--bc-faint)] sm:inline">{savedAt ? copy("Szkic zapisany.", "Draft saved.") : copy("Szkic zapisuje się automatycznie.", "Draft saves automatically.")}</span>
          <Button onClick={next} disabled={!canProceed || pending}>
            {pending ? copy("Szukamy dopasowań…", "Finding matches…") : step === TOTAL_STEPS ? copy("Zapisz i pokaż dopasowania", "Save and show matches") : copy("Dalej", "Next")}
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
        <p className="mt-1 text-sm leading-5 text-[var(--bc-muted)]">{subtitle}</p>
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
      {hint ? <p className="text-[12px] leading-4 text-[var(--bc-faint)]">{hint}</p> : null}
    </div>
  );
}

function SelectableTile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative min-h-11 rounded-[6px] border px-3 py-2.5 text-center text-sm font-medium transition-[background-color,border-color,color,box-shadow]",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950 ring-2 ring-[var(--bc-accent-strong)] ring-offset-1 ring-offset-[var(--bc-surface)]"
          : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]",
      )}
    >
      {active ? (
        <span className="absolute right-1.5 top-1.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-neutral-950 text-[var(--bc-accent)]" aria-hidden="true">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
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
        "rounded-[6px] border px-2.5 py-1.5 text-[13px] font-medium transition-[background-color,border-color,color,box-shadow]",
        active
          ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950 ring-1 ring-[var(--bc-accent-strong)]"
          : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]",
      )}
    >
      {label}
    </button>
  );
}
