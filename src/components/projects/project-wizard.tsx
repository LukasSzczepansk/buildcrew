"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CHARACTER_LABELS,
  CHARACTER_OPTIONS,
  COMMITMENT_LABELS,
  COMMITMENT_OPTIONS,
  INTEREST_OPTIONS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  STAGE_LABELS,
  STAGE_OPTIONS,
  ALL_SKILLS,
} from "@/lib/constants";
import type { Character, Commitment, Level, RoleType, Stage } from "@/db/schema";
import { createProject } from "@/server/actions/projects";

type RoleDraft = {
  roleType: RoleType | "";
  description: string;
  preferredLevel: Level | "";
  slots: number;
};

type FormState = {
  name: string;
  tagline: string;
  description: string;
  interests: string[];
  stage: Stage | "";
  technologies: string[];
  ownerContribution: string;
  roles: RoleDraft[];
  commitment: Commitment | "";
  goal: string;
  character: Character[];
};

const TOTAL_STEPS = 11;

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const crewId = searchParams.get("crewId") ?? undefined;

  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [customTech, setCustomTech] = React.useState("");
  const [form, setForm] = React.useState<FormState>({
    name: "",
    tagline: "",
    description: "",
    interests: [],
    stage: "",
    technologies: [],
    ownerContribution: "",
    roles: [{ roleType: "", description: "", preferredLevel: "", slots: 1 }],
    commitment: "",
    goal: "",
    character: [],
  });

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.name.trim().length >= 2;
      case 2:
        return form.tagline.trim().length >= 4;
      case 3:
        return form.description.trim().length >= 20;
      case 4:
        return form.interests.length >= 1;
      case 5:
        return !!form.stage;
      case 6:
        return form.technologies.length >= 1;
      case 7:
        return true;
      case 8:
        return form.roles.length >= 1 && form.roles.every((r) => r.roleType);
      case 9:
        return !!form.commitment;
      case 10:
        return form.goal.trim().length >= 3;
      case 11:
        return form.character.length >= 1;
      default:
        return true;
    }
  }, [step, form]);

  function updateRole(index: number, patch: Partial<RoleDraft>) {
    setForm((f) => ({ ...f, roles: f.roles.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));
  }

  function addRole() {
    setForm((f) => ({ ...f, roles: [...f.roles, { roleType: "", description: "", preferredLevel: "", slots: 1 }] }));
  }

  function removeRole(index: number) {
    setForm((f) => ({ ...f, roles: f.roles.filter((_, i) => i !== index) }));
  }

  async function handleSubmit() {
    setPending(true);
    const result = await createProject({
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      interests: form.interests,
      stage: form.stage as Stage,
      technologies: form.technologies,
      ownerContribution: form.ownerContribution,
      roles: form.roles.map((r) => ({
        roleType: r.roleType as RoleType,
        description: r.description,
        preferredLevel: r.preferredLevel || undefined,
        slots: r.slots,
      })),
      commitment: form.commitment as Commitment,
      goal: form.goal.trim(),
      character: form.character,
      crewId,
    }).catch((err) => {
      if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      return { error: "Coś poszło nie tak." };
    });
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
          <StepShell title="Jak nazywa się projekt?">
            <Input
              placeholder="np. HabitAI"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Jednozdaniowy opis" subtitle="Krótki tagline, który przyciągnie uwagę.">
            <Input
              placeholder="np. AI coach pomagający budować zdrowe nawyki."
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              maxLength={120}
            />
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Opisz projekt szerzej" subtitle="Jaki problem rozwiązujecie? Co chcecie zbudować?">
            <Textarea
              placeholder="Opisz problem i pomysł na rozwiązanie…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={6}
              maxLength={2000}
            />
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Kategorie / zainteresowania" subtitle="Wybierz przynajmniej jedną.">
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

        {step === 5 && (
          <StepShell title="Na jakim etapie jesteście?">
            <div className="grid grid-cols-2 gap-3">
              {STAGE_OPTIONS.map((stage) => (
                <SelectableTile key={stage} active={form.stage === stage} label={STAGE_LABELS[stage]} onClick={() => setForm((f) => ({ ...f, stage }))} />
              ))}
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="Stack / technologie" subtitle="Wybierz z listy albo dodaj własną.">
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((tech) => (
                <TagToggle
                  key={tech}
                  active={form.technologies.includes(tech)}
                  label={tech}
                  onClick={() => setForm((f) => ({ ...f, technologies: toggleValue(f.technologies, tech) }))}
                />
              ))}
              {form.technologies
                .filter((t) => !ALL_SKILLS.includes(t))
                .map((tech) => (
                  <TagToggle key={tech} active label={tech} onClick={() => setForm((f) => ({ ...f, technologies: toggleValue(f.technologies, tech) }))} />
                ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Dodaj inną technologię…"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTech.trim()) {
                    e.preventDefault();
                    setForm((f) => ({ ...f, technologies: toggleValue(f.technologies, customTech.trim()) }));
                    setCustomTech("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (customTech.trim()) {
                    setForm((f) => ({ ...f, technologies: toggleValue(f.technologies, customTech.trim()) }));
                    setCustomTech("");
                  }
                }}
              >
                Dodaj
              </Button>
            </div>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell title="Co robisz Ty jako właściciel?" subtitle="Opcjonalnie opisz swój wkład.">
            <Textarea
              placeholder="np. Odpowiadam za backend i architekturę."
              value={form.ownerContribution}
              onChange={(e) => setForm((f) => ({ ...f, ownerContribution: e.target.value }))}
              maxLength={300}
            />
          </StepShell>
        )}

        {step === 8 && (
          <StepShell title="Kogo szukacie?" subtitle="Dodaj przynajmniej jedną otwartą rolę.">
            <div className="flex flex-col gap-4">
              {form.roles.map((role, index) => (
                <div key={index} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Rola {index + 1}</p>
                    {form.roles.length > 1 && (
                      <button type="button" onClick={() => removeRole(index)} className="text-neutral-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={role.roleType || undefined} onValueChange={(v) => updateRole(index, { roleType: v as RoleType })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ roli" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={role.preferredLevel || undefined} onValueChange={(v) => updateRole(index, { preferredLevel: v as Level })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Preferowany poziom" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {LEVEL_LABELS[l]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Krótki opis roli"
                    value={role.description}
                    onChange={(e) => updateRole(index, { description: e.target.value })}
                    maxLength={240}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Label htmlFor={`slots-${index}`} className="text-xs text-neutral-400">
                      Liczba miejsc
                    </Label>
                    <Input
                      id={`slots-${index}`}
                      type="number"
                      min={1}
                      max={10}
                      className="w-20"
                      value={role.slots}
                      onChange={(e) => updateRole(index, { slots: Number(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="gap-2" onClick={addRole}>
                <Plus className="h-4 w-4" /> Dodaj kolejną rolę
              </Button>
            </div>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell title="Ile czasu tygodniowo wymaga projekt?">
            <div className="grid grid-cols-2 gap-3">
              {COMMITMENT_OPTIONS.map((c) => (
                <SelectableTile key={c} active={form.commitment === c} label={COMMITMENT_LABELS[c]} onClick={() => setForm((f) => ({ ...f, commitment: c }))} />
              ))}
            </div>
          </StepShell>
        )}

        {step === 10 && (
          <StepShell title="Jaki jest cel projektu?" subtitle='np. "Zrobić MVP w 4 tygodnie."'>
            <Input placeholder="Cel projektu" value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} maxLength={200} />
          </StepShell>
        )}

        {step === 11 && (
          <StepShell title="Jaki jest charakter projektu?" subtitle="Możesz zaznaczyć kilka.">
            <div className="flex flex-wrap gap-2">
              {CHARACTER_OPTIONS.map((c) => (
                <TagToggle key={c} active={form.character.includes(c)} label={CHARACTER_LABELS[c]} onClick={() => setForm((f) => ({ ...f, character: toggleValue(f.character, c) }))} />
              ))}
            </div>
          </StepShell>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>
          Wstecz
        </Button>
        <Button onClick={next} disabled={!canProceed || pending} size="lg">
          {pending ? "Publikowanie…" : step === TOTAL_STEPS ? "Opublikuj projekt" : "Dalej"}
        </Button>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
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
        active ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "border-neutral-200 hover:border-violet-300 dark:border-neutral-700",
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
        active ? "border-violet-500 bg-violet-600 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-violet-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
      )}
    >
      {label}
    </button>
  );
}
