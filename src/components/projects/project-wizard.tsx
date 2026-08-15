"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ALL_SKILLS,
  CHARACTER_LABELS,
  CHARACTER_OPTIONS,
  COLLABORATION_MODE_LABELS,
  COLLABORATION_MODE_OPTIONS,
  COLLABORATION_PACE_LABELS,
  COLLABORATION_PACE_OPTIONS,
  COMMITMENT_LABELS,
  COMMITMENT_OPTIONS,
  INTEREST_OPTIONS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  PROJECT_ASSET_LABELS,
  PROJECT_ASSET_OPTIONS,
  PROJECT_DURATION_LABELS,
  PROJECT_DURATION_OPTIONS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  STAGE_LABELS,
  STAGE_OPTIONS,
} from "@/lib/constants";
import type {
  Character,
  CollaborationMode,
  CollaborationPace,
  Commitment,
  Level,
  ProjectAsset,
  ProjectDuration,
  ProjectType,
  RoleType,
  Stage,
} from "@/db/schema";
import { createProject } from "@/server/actions/projects";

const DRAFT_KEY_PREFIX = "buildcrew:project-draft:v2";
const TOTAL_STEPS = 5;

const STEP_LABELS = ["Podstawy", "Projekt", "Ekipa", "Współpraca", "Podgląd"] as const;

type RoleDraft = {
  roleType: RoleType | "";
  description: string;
  preferredLevel: Level | "";
  skills: string[];
  slots: number;
};

type FormState = {
  name: string;
  tagline: string;
  description: string;
  interests: string[];
  stage: Stage | "";
  projectType: ProjectType | "";
  technologies: string[];
  existingAssets: ProjectAsset[];
  ownerContribution: string;
  goal: string;
  repositoryUrl: string;
  demoUrl: string;
  designUrl: string;
  docsUrl: string;
  roles: RoleDraft[];
  commitment: Commitment | "";
  collaborationMode: CollaborationMode | "";
  collaborationPace: CollaborationPace | "";
  duration: ProjectDuration | "";
  character: Character[];
};

const EMPTY_ROLE: RoleDraft = {
  roleType: "",
  description: "",
  preferredLevel: "",
  skills: [],
  slots: 1,
};

const EMPTY_FORM: FormState = {
  name: "",
  tagline: "",
  description: "",
  interests: [],
  stage: "",
  projectType: "",
  technologies: [],
  existingAssets: [],
  ownerContribution: "",
  goal: "",
  repositoryUrl: "",
  demoUrl: "",
  designUrl: "",
  docsUrl: "",
  roles: [{ ...EMPTY_ROLE }],
  commitment: "",
  collaborationMode: "REMOTE",
  collaborationPace: "REGULAR",
  duration: "3_6_MONTHS",
  character: [],
};

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

function hasUsefulDraft(value: FormState) {
  return Boolean(
    value.name ||
      value.tagline ||
      value.description ||
      value.technologies.length ||
      value.interests.length ||
      value.roles.some((role) => role.roleType || role.description || role.skills.length),
  );
}

export function ProjectWizard({
  draftKey = "session",
  initialData,
  sourceIdeaId,
}: {
  draftKey?: string;
  initialData?: Partial<Pick<FormState, "name" | "tagline" | "description" | "interests">>;
  sourceIdeaId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const crewId = searchParams.get("crewId") ?? undefined;
  const storageKey = `${DRAFT_KEY_PREFIX}:${draftKey}${sourceIdeaId ? `:idea:${sourceIdeaId}` : ""}`;
  const initialForm: FormState = {
    ...EMPTY_FORM,
    ...initialData,
    interests: initialData?.interests ?? EMPTY_FORM.interests,
  };

  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [draftState, setDraftState] = React.useState<"idle" | "restored" | "saving" | "saved">("idle");
  const [form, setForm] = React.useState<FormState>(initialForm);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        const restored: FormState = {
          ...EMPTY_FORM,
          ...parsed,
          roles:
            Array.isArray(parsed.roles) && parsed.roles.length
              ? parsed.roles.map((role) => ({ ...EMPTY_ROLE, ...role, skills: Array.isArray(role.skills) ? role.skills : [] }))
              : [{ ...EMPTY_ROLE }],
          interests: Array.isArray(parsed.interests) ? parsed.interests : [],
          technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
          existingAssets: Array.isArray(parsed.existingAssets) ? parsed.existingAssets : [],
          character: Array.isArray(parsed.character) ? parsed.character : [],
        };
        if (hasUsefulDraft(restored)) {
          setForm(restored);
          setDraftState("restored");
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (!hydrated) return;
    setDraftState((current) => (current === "restored" ? current : "saving"));
    const timer = window.setTimeout(() => {
      try {
        if (hasUsefulDraft(form)) {
          window.localStorage.setItem(storageKey, JSON.stringify(form));
          setDraftState("saved");
        } else {
          window.localStorage.removeItem(storageKey);
          setDraftState("idle");
        }
      } catch {
        setDraftState("idle");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, hydrated, storageKey]);

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1:
        return (
          form.name.trim().length >= 2 &&
          form.tagline.trim().length >= 4 &&
          Boolean(form.projectType) &&
          Boolean(form.stage) &&
          form.interests.length >= 1
        );
      case 2:
        return form.description.trim().length >= 20 && form.technologies.length >= 1 && form.goal.trim().length >= 3;
      case 3:
        return form.roles.length >= 1 && form.roles.every((role) => Boolean(role.roleType));
      case 4:
        return Boolean(form.commitment && form.collaborationMode && form.collaborationPace && form.duration) && form.character.length >= 1;
      default:
        return true;
    }
  }, [form, step]);

  const qualityHints = React.useMemo(() => {
    const hints: string[] = [];
    if (!form.ownerContribution.trim()) hints.push("Dodaj krótko, za co odpowiadasz jako autor projektu.");
    if (!form.existingAssets.length) hints.push("Zaznacz, co już istnieje — ułatwia ocenę, czy projekt żyje.");
    if (!form.repositoryUrl && !form.demoUrl && !form.designUrl) hints.push("Jeśli możesz, dodaj repo, demo albo projekt w Figmie.");
    if (form.roles.some((role) => !role.description.trim())) hints.push("Dopisz zakres odpowiedzialności przynajmniej do najważniejszej roli.");
    if (form.roles.some((role) => role.skills.length === 0)) hints.push("Dodaj technologie lub umiejętności do ról, żeby poprawić przyszłe dopasowania.");
    return hints;
  }, [form]);

  function updateRole(index: number, patch: Partial<RoleDraft>) {
    setForm((current) => ({
      ...current,
      roles: current.roles.map((role, roleIndex) => (roleIndex === index ? { ...role, ...patch } : role)),
    }));
  }

  function addRole() {
    setForm((current) => ({ ...current, roles: [...current.roles, { ...EMPTY_ROLE }] }));
  }

  function removeRole(index: number) {
    setForm((current) => ({ ...current, roles: current.roles.filter((_, roleIndex) => roleIndex !== index) }));
  }

  function clearDraft() {
    if (hasUsefulDraft(form) && !window.confirm("Wyczyścić cały zapisany szkic projektu?")) return;
    window.localStorage.removeItem(storageKey);
    setForm(initialForm);
    setStep(1);
    setDraftState("idle");
  }

  async function handleSubmit() {
    setPending(true);
    const result = await createProject({
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      interests: form.interests,
      stage: form.stage as Stage,
      projectType: form.projectType as ProjectType,
      technologies: form.technologies,
      existingAssets: form.existingAssets,
      ownerContribution: form.ownerContribution.trim(),
      goal: form.goal.trim(),
      repositoryUrl: form.repositoryUrl.trim(),
      demoUrl: form.demoUrl.trim(),
      designUrl: form.designUrl.trim(),
      docsUrl: form.docsUrl.trim(),
      roles: form.roles.map((role) => ({
        roleType: role.roleType as RoleType,
        description: role.description.trim(),
        preferredLevel: role.preferredLevel || undefined,
        skills: role.skills,
        slots: role.slots,
      })),
      commitment: form.commitment as Commitment,
      collaborationMode: form.collaborationMode as CollaborationMode,
      collaborationPace: form.collaborationPace as CollaborationPace,
      duration: form.duration as ProjectDuration,
      character: form.character,
      crewId,
      sourceIdeaId,
    }).catch(() => ({ error: "Nie udało się utworzyć projektu." }));
    setPending(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if ("projectId" in result && result.projectId) {
      window.localStorage.removeItem(storageKey);
      toast.success("Projekt został opublikowany.");
      router.push(`/projects/${result.projectId}?created=1`);
      router.refresh();
    }
  }

  function next() {
    if (!canProceed) return;
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
    <div className="mx-auto w-full max-w-[900px] pb-16">
      <div className="border-y border-[var(--bc-line)]">
        <div className="flex min-w-max overflow-x-auto">
          {STEP_LABELS.map((label, index) => {
            const currentStep = index + 1;
            const active = currentStep === step;
            const done = currentStep < step;
            return (
              <div
                key={label}
                className={cn(
                  "relative flex min-w-[138px] flex-1 items-center gap-2 border-r border-[var(--bc-line)] px-4 py-3 text-[13px] last:border-r-0",
                  active ? "font-semibold text-[var(--bc-ink)]" : done ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]",
                )}
              >
                <span className={cn("text-[12px] tabular-nums", active && "text-[var(--bc-ink)]")}>0{currentStep}</span>
                <span>{label}</span>
                {active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[var(--bc-accent)]" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex min-h-5 items-center justify-between gap-4 text-[12px] text-[var(--bc-faint)]">
        <span>
          {draftState === "restored"
            ? "Przywrócono szkic zapisany na tym urządzeniu."
            : draftState === "saving"
              ? "Zapisywanie szkicu…"
              : draftState === "saved"
                ? "Szkic zapisany lokalnie."
                : "Szkic zapisuje się automatycznie na tym urządzeniu."}
        </span>
        {hasUsefulDraft(form) ? (
          <button type="button" onClick={clearDraft} className="shrink-0 text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">
            Wyczyść szkic
          </button>
        ) : null}
      </div>

      <section className="mt-8">
        {step === 1 ? <BasicsStep form={form} setForm={setForm} /> : null}
        {step === 2 ? <ProjectStep form={form} setForm={setForm} /> : null}
        {step === 3 ? <CrewStep form={form} updateRole={updateRole} addRole={addRole} removeRole={removeRole} /> : null}
        {step === 4 ? <CollaborationStep form={form} setForm={setForm} /> : null}
        {step === 5 ? <PreviewStep form={form} qualityHints={qualityHints} /> : null}
      </section>

      <div className="mt-10 flex items-center justify-between border-t border-[var(--bc-line)] pt-5">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 1 || pending}>
          Wstecz
        </Button>
        <div className="flex items-center gap-3">
          {!canProceed && step < TOTAL_STEPS ? <span className="hidden text-[12px] text-[var(--bc-faint)] sm:inline">Uzupełnij wymagane pola.</span> : null}
          <Button type="button" onClick={next} disabled={!canProceed || pending}>
            {pending ? "Publikowanie…" : step === TOTAL_STEPS ? "Opublikuj projekt" : "Dalej"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BasicsStep({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <StepShell
      eyebrow="01 / Podstawy"
      title="Najpierw powiedz, co właściwie budujecie."
      subtitle="To są informacje, które ludzie zobaczą jako pierwsze na liście projektów."
    >
      <Field label="Nazwa projektu" required hint={`${form.name.length}/60`}>
        <Input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="np. Splitly"
          maxLength={60}
          autoFocus
        />
      </Field>

      <Field label="Jedno zdanie o projekcie" required hint={`${form.tagline.length}/120`}>
        <Input
          value={form.tagline}
          onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
          placeholder="np. Prosty podział wspólnych wydatków bez arkuszy."
          maxLength={120}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Typ projektu" required>
          <Select value={form.projectType || undefined} onValueChange={(value) => setForm((current) => ({ ...current, projectType: value as ProjectType }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
            <SelectContent>{PROJECT_TYPE_OPTIONS.map((type) => <SelectItem key={type} value={type}>{PROJECT_TYPE_LABELS[type]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Etap" required>
          <Select value={form.stage || undefined} onValueChange={(value) => setForm((current) => ({ ...current, stage: value as Stage }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz etap" /></SelectTrigger>
            <SelectContent>{STAGE_OPTIONS.map((stage) => <SelectItem key={stage} value={stage}>{STAGE_LABELS[stage]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Obszary" required description="Wybierz 1–5 tematów. Pomagają w discovery i przyszłych dopasowaniach.">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <ToggleButton
              key={interest}
              active={form.interests.includes(interest)}
              disabled={!form.interests.includes(interest) && form.interests.length >= 5}
              onClick={() => setForm((current) => ({ ...current, interests: toggleValue(current.interests, interest) }))}
            >
              {interest}
            </ToggleButton>
          ))}
        </div>
      </Field>
    </StepShell>
  );
}

function ProjectStep({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <StepShell
      eyebrow="02 / Projekt"
      title="Pokaż stan projektu, nie tylko pomysł."
      subtitle="Im więcej konkretu, tym łatwiej komuś zdecydować, czy chce poświęcić czas na rozmowę."
    >
      <Field label="Opis" required hint={`${form.description.length}/2400`} description="Jaki problem rozwiązujecie, dla kogo i co chcecie zbudować w pierwszej wersji?">
        <Textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Opisz problem, odbiorcę i najważniejszy zakres pierwszej wersji…"
          rows={7}
          maxLength={2400}
        />
      </Field>

      <Field label="Stack projektu" required description="To technologie używane przez projekt jako całość. Wymagania konkretnej roli dodasz w następnym kroku.">
        <TechnologyPicker
          values={form.technologies}
          onChange={(values) => setForm((current) => ({ ...current, technologies: values }))}
          placeholder="Szukaj np. React, Supabase, Figma…"
          max={15}
        />
      </Field>

      <Field label="Co już istnieje?" description="Zaznacz realny stan. Nie musisz mieć MVP, żeby opublikować projekt.">
        <div className="grid gap-px overflow-hidden border border-[var(--bc-line)] bg-[var(--bc-line)] sm:grid-cols-2">
          {PROJECT_ASSET_OPTIONS.map((asset) => {
            const active = form.existingAssets.includes(asset);
            return (
              <button
                key={asset}
                type="button"
                aria-pressed={active}
                onClick={() => setForm((current) => ({ ...current, existingAssets: toggleValue(current.existingAssets, asset) }))}
                className={cn(
                  "flex min-h-11 items-center justify-between bg-[var(--bc-surface)] px-3 text-left text-sm transition-colors hover:bg-[var(--bc-surface-subtle)]",
                  active && "font-medium text-[var(--bc-ink)]",
                )}
              >
                <span>{PROJECT_ASSET_LABELS[asset]}</span>
                <span className={cn("h-2 w-2 rounded-full border border-[var(--bc-line-strong)]", active && "border-[var(--bc-accent)] bg-[var(--bc-accent)]")} />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Najbliższy cel" required hint={`${form.goal.length}/240`} description="Jedna konkretna rzecz, którą chcecie dowieźć jako następną.">
        <Input
          value={form.goal}
          onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
          placeholder="np. Wypuścić MVP i zebrać feedback od pierwszych 20 użytkowników."
          maxLength={240}
        />
      </Field>

      <Field label="Twój wkład" hint={`${form.ownerContribution.length}/400`} description="Opcjonalne, ale pomaga zrozumieć, czego nie szukasz u innych.">
        <Textarea
          value={form.ownerContribution}
          onChange={(event) => setForm((current) => ({ ...current, ownerContribution: event.target.value }))}
          placeholder="np. Backend, architektura i kontakt z pierwszymi użytkownikami."
          rows={3}
          maxLength={400}
        />
      </Field>

      <div>
        <div className="mb-3">
          <Label className="text-sm font-medium">Linki</Label>
          <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">Dodaj tylko to, co faktycznie istnieje. Wszystkie pola są opcjonalne.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <LinkField label="Repozytorium" value={form.repositoryUrl} onChange={(repositoryUrl) => setForm((current) => ({ ...current, repositoryUrl }))} placeholder="https://github.com/…" />
          <LinkField label="Demo / landing" value={form.demoUrl} onChange={(demoUrl) => setForm((current) => ({ ...current, demoUrl }))} placeholder="https://…" />
          <LinkField label="Design / Figma" value={form.designUrl} onChange={(designUrl) => setForm((current) => ({ ...current, designUrl }))} placeholder="https://figma.com/…" />
          <LinkField label="Dokumentacja" value={form.docsUrl} onChange={(docsUrl) => setForm((current) => ({ ...current, docsUrl }))} placeholder="https://…" />
        </div>
      </div>
    </StepShell>
  );
}

function CrewStep({
  form,
  updateRole,
  addRole,
  removeRole,
}: {
  form: FormState;
  updateRole: (index: number, patch: Partial<RoleDraft>) => void;
  addRole: () => void;
  removeRole: (index: number) => void;
}) {
  return (
    <StepShell
      eyebrow="03 / Ekipa"
      title="Opisz osoby, których naprawdę potrzebujesz."
      subtitle="Wymagania zapisane przy roli są bardziej użyteczne niż ogólny stack projektu."
    >
      <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
        {form.roles.map((role, index) => (
          <div key={index} className="py-6 first:pt-5 last:pb-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Rola {index + 1}</p>
                <p className="mt-1 text-[12px] text-[var(--bc-faint)]">Określ rolę, liczbę miejsc i konkretny zakres.</p>
              </div>
              {form.roles.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRole(index)} aria-label={`Usuń rolę ${index + 1}`}>
                  <Trash2 className="h-3.5 w-3.5" /> Usuń
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
              <Field label="Rola" required compact>
                <Select value={role.roleType || undefined} onValueChange={(value) => updateRole(index, { roleType: value as RoleType })}>
                  <SelectTrigger><SelectValue placeholder="Wybierz rolę" /></SelectTrigger>
                  <SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{ROLE_LABELS[option]}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Poziom" compact>
                <Select value={role.preferredLevel || "ANY"} onValueChange={(value) => updateRole(index, { preferredLevel: value === "ANY" ? "" : value as Level })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Dowolny</SelectItem>
                    {LEVEL_OPTIONS.map((option) => <SelectItem key={option} value={option}>{LEVEL_LABELS[option]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Miejsca" compact>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={role.slots}
                  onChange={(event) => updateRole(index, { slots: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Zakres odpowiedzialności" hint={`${role.description.length}/360`} compact>
                <Textarea
                  value={role.description}
                  onChange={(event) => updateRole(index, { description: event.target.value })}
                  placeholder="np. Zbudowanie dashboardu, integracja z API i dopracowanie responsive."
                  rows={3}
                  maxLength={360}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Umiejętności dla tej roli" description="Nie muszą być identyczne ze stackiem projektu." compact>
                <TechnologyPicker
                  values={role.skills}
                  onChange={(skills) => updateRole(index, { skills })}
                  placeholder="np. React, TypeScript, UI Design…"
                  max={12}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addRole} disabled={form.roles.length >= 8}>
        <Plus className="h-4 w-4" /> Dodaj kolejną rolę
      </Button>
    </StepShell>
  );
}

function CollaborationStep({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <StepShell
      eyebrow="04 / Współpraca"
      title="Ustal oczekiwania zanim zacznie się rozmowa."
      subtitle="Te dane pomagają odsiać niedopasowania czasowe i organizacyjne."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Zaangażowanie" required>
          <Select value={form.commitment || undefined} onValueChange={(value) => setForm((current) => ({ ...current, commitment: value as Commitment }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz czas" /></SelectTrigger>
            <SelectContent>{COMMITMENT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{COMMITMENT_LABELS[option]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Tryb współpracy" required>
          <Select value={form.collaborationMode || undefined} onValueChange={(value) => setForm((current) => ({ ...current, collaborationMode: value as CollaborationMode }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz tryb" /></SelectTrigger>
            <SelectContent>{COLLABORATION_MODE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{COLLABORATION_MODE_LABELS[option]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Tempo" required>
          <Select value={form.collaborationPace || undefined} onValueChange={(value) => setForm((current) => ({ ...current, collaborationPace: value as CollaborationPace }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz tempo" /></SelectTrigger>
            <SelectContent>{COLLABORATION_PACE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{COLLABORATION_PACE_LABELS[option]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Planowany horyzont" required>
          <Select value={form.duration || undefined} onValueChange={(value) => setForm((current) => ({ ...current, duration: value as ProjectDuration }))}>
            <SelectTrigger><SelectValue placeholder="Wybierz horyzont" /></SelectTrigger>
            <SelectContent>{PROJECT_DURATION_OPTIONS.map((option) => <SelectItem key={option} value={option}>{PROJECT_DURATION_LABELS[option]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Charakter projektu" required description="Wybierz maksymalnie 3. To opis intencji projektu, nie model prawny współpracy.">
        <div className="flex flex-wrap gap-2">
          {CHARACTER_OPTIONS.map((character) => (
            <ToggleButton
              key={character}
              active={form.character.includes(character)}
              disabled={!form.character.includes(character) && form.character.length >= 3}
              onClick={() => setForm((current) => ({ ...current, character: toggleValue(current.character, character) }))}
            >
              {CHARACTER_LABELS[character]}
            </ToggleButton>
          ))}
        </div>
      </Field>

      <div className="border-l-2 border-[var(--bc-accent)] pl-4 text-[13px] leading-5 text-[var(--bc-muted)]">
        BuildCrew pomaga znaleźć współtwórców. Ustalenia dotyczące wynagrodzenia, udziałów, praw do kodu i odpowiedzialności ustalacie bezpośrednio między sobą.
      </div>
    </StepShell>
  );
}

function PreviewStep({ form, qualityHints }: { form: FormState; qualityHints: string[] }) {
  return (
    <StepShell
      eyebrow="05 / Podgląd"
      title="Sprawdź, czy projekt mówi wystarczająco dużo."
      subtitle="Po publikacji od razu przejdziesz do projektu i będziesz mógł go udostępnić."
    >
      <div className="border-y border-[var(--bc-line)] py-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.07em] text-[var(--bc-faint)]">
          <span>{form.projectType ? PROJECT_TYPE_LABELS[form.projectType] : "Typ projektu"}</span>
          <span>·</span>
          <span>{form.stage ? STAGE_LABELS[form.stage] : "Etap"}</span>
          <span>·</span>
          <span>{form.commitment ? COMMITMENT_LABELS[form.commitment] : "Czas"}</span>
        </div>
        <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)]">{form.name || "Nazwa projektu"}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[var(--bc-muted)]">{form.tagline || "Krótki opis projektu."}</p>
        <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-6 text-[var(--bc-muted)]">{form.description}</p>

        <div className="mt-6 grid gap-px border border-[var(--bc-line)] bg-[var(--bc-line)] sm:grid-cols-3">
          <PreviewCell label="Najbliższy cel" value={form.goal || "—"} />
          <PreviewCell label="Tryb" value={form.collaborationMode ? COLLABORATION_MODE_LABELS[form.collaborationMode] : "—"} />
          <PreviewCell label="Horyzont" value={form.duration ? PROJECT_DURATION_LABELS[form.duration] : "—"} />
        </div>

        <div className="mt-6">
          <p className="text-[12px] uppercase tracking-[0.07em] text-[var(--bc-faint)]">Stack</p>
          <p className="mt-2 text-sm leading-6">{form.technologies.join(" · ") || "—"}</p>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.07em] text-[var(--bc-faint)]">Otwarte role</p>
        <div className="mt-2 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
          {form.roles.map((role, index) => (
            <div key={index} className="grid gap-3 py-4 sm:grid-cols-[180px_minmax(0,1fr)_90px] sm:items-start">
              <div>
                <p className="text-sm font-semibold">{role.roleType ? ROLE_LABELS[role.roleType] : `Rola ${index + 1}`}</p>
                <p className="mt-1 text-[12px] text-[var(--bc-faint)]">{role.preferredLevel ? LEVEL_LABELS[role.preferredLevel] : "Dowolny poziom"}</p>
              </div>
              <div>
                <p className="text-[13px] leading-5 text-[var(--bc-muted)]">{role.description || "Zakres nie został jeszcze opisany."}</p>
                {role.skills.length ? <p className="mt-2 text-[12px] text-[var(--bc-faint)]">{role.skills.join(" · ")}</p> : null}
              </div>
              <p className="text-[13px] tabular-nums text-[var(--bc-muted)] sm:text-right">{role.slots} {role.slots === 1 ? "miejsce" : "miejsca"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-l-2 border-[var(--bc-line-strong)] pl-4">
        {qualityHints.length ? (
          <>
            <p className="text-sm font-semibold">Możesz opublikować teraz. Warto jeszcze rozważyć:</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">
              {qualityHints.slice(0, 4).map((hint) => <li key={hint}>— {hint}</li>)}
            </ul>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Projekt ma komplet najważniejszych informacji.</p>
            <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">Po publikacji możesz go udostępnić albo przejść do szukania osób.</p>
          </>
        )}
      </div>
    </StepShell>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="max-w-[680px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{eyebrow}</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)] sm:text-[30px]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--bc-muted)]">{subtitle}</p>
      </div>
      <div className="mt-8 space-y-7">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  description,
  hint,
  compact = false,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  hint?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!compact && "border-b border-[var(--bc-line)] pb-7 last:border-b-0 last:pb-0")}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label className="text-sm font-medium text-[var(--bc-ink)]">
          {label}{required ? <span className="ml-1 text-[var(--bc-faint)]">*</span> : null}
        </Label>
        {hint ? <span className="text-[11px] tabular-nums text-[var(--bc-faint)]">{hint}</span> : null}
      </div>
      {description ? <p className="mb-2.5 text-[12px] leading-5 text-[var(--bc-muted)]">{description}</p> : null}
      {children}
    </div>
  );
}

function LinkField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] text-[var(--bc-muted)]">{label}</label>
      <Input type="url" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ToggleButton({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-[6px] border px-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "border-[var(--bc-ink)] bg-[var(--bc-ink)] text-[var(--bc-surface)] dark:border-[var(--bc-accent)] dark:bg-[var(--bc-accent)] dark:text-neutral-950"
          : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]",
      )}
    >
      {children}
    </button>
  );
}

function TechnologyPicker({ values, onChange, placeholder, max }: { values: string[]; onChange: (values: string[]) => void; placeholder: string; max: number }) {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const suggestions = React.useMemo(() => {
    if (!normalized) return [];
    return ALL_SKILLS.filter((skill) => !values.includes(skill) && skill.toLowerCase().includes(normalized)).slice(0, 8);
  }, [normalized, values]);
  const exactExists = ALL_SKILLS.some((skill) => skill.toLowerCase() === normalized) || values.some((skill) => skill.toLowerCase() === normalized);
  const canAddCustom = Boolean(normalized && !exactExists && values.length < max);

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || values.length >= max || values.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...values, trimmed]);
    setQuery("");
  }

  return (
    <div>
      {values.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[5px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2.5 text-[12px] text-[var(--bc-ink)] hover:border-[var(--bc-line-strong)]"
              title={`Usuń ${value}`}
            >
              {value}<X className="h-3 w-3 text-[var(--bc-faint)]" />
            </button>
          ))}
        </div>
      ) : null}

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (suggestions[0]) add(suggestions[0]);
            else if (canAddCustom) add(query);
          }
        }}
        placeholder={values.length >= max ? `Maksymalnie ${max}` : placeholder}
        disabled={values.length >= max}
      />

      {values.length < max && (suggestions.length || canAddCustom) ? (
        <div className="mt-1 overflow-hidden border border-[var(--bc-line)] bg-[var(--bc-surface)]">
          {suggestions.map((skill) => (
            <button key={skill} type="button" onClick={() => add(skill)} className="block w-full border-b border-[var(--bc-line)] px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-[var(--bc-surface-subtle)]">
              {skill}
            </button>
          ))}
          {canAddCustom ? (
            <button type="button" onClick={() => add(query)} className="block w-full border-t border-[var(--bc-line)] px-3 py-2 text-left text-[13px] font-medium hover:bg-[var(--bc-surface-subtle)]">
              Dodaj własne: “{query.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="mt-1.5 text-[11px] tabular-nums text-[var(--bc-faint)]">{values.length}/{max}</p>
    </div>
  );
}

function PreviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bc-surface)] p-4">
      <p className="text-[11px] uppercase tracking-[0.07em] text-[var(--bc-faint)]">{label}</p>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-ink)]">{value}</p>
    </div>
  );
}
