"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const TOTAL_STEPS = 10;

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
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
  });

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.username.trim().length >= 2 && /^[a-zA-Z0-9_]+$/.test(form.username.trim());
      case 2:
        return !!form.role;
      case 3:
        return form.skills.length >= 1;
      case 4:
        return !!form.level;
      case 5:
        return true;
      case 6:
        return !!form.weeklyHours;
      case 7:
        return true;
      case 8:
        return form.lookingFor.length >= 1;
      default:
        return true;
    }
  }, [step, form]);

  async function handleSubmit() {
    setPending(true);
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
    }).catch((err) => {
      if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      return { error: "Coś poszło nie tak." };
    });
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.push("/dashboard");
  }

  function next() {
    if (step === TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Krok {step} z {TOTAL_STEPS}
          </span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div className="animate-fade-in rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {step === 1 && (
          <StepShell title="Jak mamy Cię nazywać?" subtitle="Wybierz nick. Nie wymagamy prawdziwego imienia i nazwiska.">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Nick</Label>
              <Input
                id="username"
                placeholder="np. CodePanda"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
              />
              <p className="text-xs text-neutral-400">Litery, cyfry, podkreślenia. Widoczny publicznie.</p>
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Jaka jest Twoja główna rola?" subtitle="Wybierz jedną rolę, która najlepiej Cię opisuje.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ROLE_OPTIONS.map((role) => (
                <SelectableTile
                  key={role}
                  active={form.role === role}
                  label={ROLE_LABELS[role]}
                  onClick={() => setForm((f) => ({ ...f, role }))}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Jakie masz umiejętności?" subtitle="Wybierz przynajmniej jedną. Możesz zaznaczyć wiele.">
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(SKILL_GROUPS).map(([group, list]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((skill) => (
                      <TagToggle
                        key={skill}
                        active={form.skills.includes(skill)}
                        label={skill}
                        onClick={() => setForm((f) => ({ ...f, skills: toggleValue(f.skills, skill) }))}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Jaki jest Twój poziom?" subtitle="Bądź szczery — to pomaga w dopasowaniu.">
            <div className="flex flex-col gap-3">
              {LEVEL_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, level }))}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    form.level === level
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-neutral-200 hover:border-violet-300 dark:border-neutral-700",
                  )}
                >
                  <p className="font-medium">{LEVEL_LABELS[level]}</p>
                  <p className="text-sm text-neutral-500">{LEVEL_DESCRIPTIONS[level]}</p>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Co Cię interesuje?" subtitle="Pomoże nam to dopasować Cię do projektów i osób w Build Pool.">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <TagToggle
                  key={interest}
                  active={form.interests.includes(interest)}
                  label={interest}
                  onClick={() => setForm((f) => ({ ...f, interests: toggleValue(f.interests, interest) }))}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="Ile czasu możesz poświęcić tygodniowo?" subtitle="Szczera odpowiedź ułatwia znalezienie dobrego zespołu.">
            <div className="grid grid-cols-2 gap-3">
              {COMMITMENT_OPTIONS.map((c) => (
                <SelectableTile
                  key={c}
                  active={form.weeklyHours === c}
                  label={COMMITMENT_LABELS[c]}
                  onClick={() => setForm((f) => ({ ...f, weeklyHours: c }))}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell title="Po co chcesz budować?" subtitle="Możesz zaznaczyć kilka celów.">
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <TagToggle
                  key={goal}
                  active={form.goals.includes(goal)}
                  label={GOAL_LABELS[goal]}
                  onClick={() => setForm((f) => ({ ...f, goals: toggleValue(f.goals, goal) }))}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell title="Czego obecnie szukasz?" subtitle="Możesz zaznaczyć więcej niż jedną opcję.">
            <div className="flex flex-col gap-3">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                    form.lookingFor.includes(option)
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-neutral-200 hover:border-violet-300 dark:border-neutral-700",
                  )}
                >
                  <Checkbox
                    checked={form.lookingFor.includes(option)}
                    onCheckedChange={() => setForm((f) => ({ ...f, lookingFor: toggleValue(f.lookingFor, option) }))}
                  />
                  <span className="text-sm font-medium">{LOOKING_FOR_LABELS[option]}</span>
                </label>
              ))}
            </div>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell title="Linki (opcjonalnie)" subtitle="Możesz je dodać teraz albo później w profilu.">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/twojnick"
                  value={form.githubUrl}
                  onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input
                  id="portfolio"
                  placeholder="https://twojaportfolio.pl"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/twojnick"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                />
              </div>
            </div>
          </StepShell>
        )}

        {step === 10 && (
          <StepShell
            title="Discord (opcjonalnie)"
            subtitle="Twój Discord jest prywatny — pokażemy go tylko po zaakceptowanym połączeniu."
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discord">Nazwa użytkownika Discord</Label>
              <Input
                id="discord"
                placeholder="np. codepanda123"
                value={form.discordUsername}
                onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))}
              />
            </div>
          </StepShell>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>
          Wstecz
        </Button>
        <Button onClick={next} disabled={!canProceed || pending} size="lg">
          {pending ? "Zapisywanie…" : step === TOTAL_STEPS ? "Zakończ onboarding" : "Dalej"}
        </Button>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SelectableTile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-center text-sm font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          : "border-neutral-200 hover:border-violet-300 dark:border-neutral-700",
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
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-violet-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
      )}
    >
      {label}
    </button>
  );
}
