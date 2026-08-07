"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { updateProfile } from "@/server/actions/profile";

type EditableProfile = {
  username: string;
  role: RoleType;
  level: Level;
  weeklyHours: Commitment;
  bio: string;
  skills: string[];
  interests: string[];
  goals: Goal[];
  lookingFor: LookingFor[];
  githubUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  discordUsername: string;
};

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

export function ProfileEditForm({ initial }: { initial: EditableProfile }) {
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const result = await updateProfile(form).catch(() => ({ error: "Nie udało się zapisać profilu." }));
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil zapisany.");
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <SectionTitle title="Podstawy" subtitle="To zobaczą inni builderzy." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nick">
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              maxLength={24}
            />
          </Field>
          <Field label="Główna rola">
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <ChoiceButton
                  key={role}
                  active={form.role === role}
                  onClick={() => setForm((f) => ({ ...f, role }))}
                >
                  {ROLE_LABELS[role]}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Krótko o Tobie">
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Np. Buduję małe SaaS-y i chcę poznać ludzi do wspólnych projektów."
              maxLength={280}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Umiejętności" subtitle="Wybierz technologie, z którymi rzeczywiście chcesz budować." />
        <div className="mt-5 flex max-h-[30rem] flex-col gap-4 overflow-y-auto pr-1">
          {Object.entries(SKILL_GROUPS).map(([group, skills]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group}</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <TagButton
                    key={skill}
                    active={form.skills.includes(skill)}
                    onClick={() => setForm((f) => ({ ...f, skills: toggleValue(f.skills, skill) }))}
                  >
                    {skill}
                  </TagButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Dopasowanie" subtitle="Te dane pomagają dobierać projekty i osoby w Build Pool." />

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Poziom</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {LEVEL_OPTIONS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((f) => ({ ...f, level }))}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  form.level === level
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                    : "border-neutral-200 hover:border-violet-300 dark:border-neutral-700",
                )}
              >
                <span className="block text-sm font-medium">{LEVEL_LABELS[level]}</span>
                <span className="mt-1 block text-xs text-neutral-500">{LEVEL_DESCRIPTIONS[level]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Czas w tygodniu</p>
          <div className="flex flex-wrap gap-2">
            {COMMITMENT_OPTIONS.map((commitment) => (
              <TagButton
                key={commitment}
                active={form.weeklyHours === commitment}
                onClick={() => setForm((f) => ({ ...f, weeklyHours: commitment }))}
              >
                {COMMITMENT_LABELS[commitment]}
              </TagButton>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Interesuje mnie</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <TagButton
                key={interest}
                active={form.interests.includes(interest)}
                onClick={() => setForm((f) => ({ ...f, interests: toggleValue(f.interests, interest) }))}
              >
                {interest}
              </TagButton>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Po co chcesz budować?</p>
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <CheckRow
                  key={goal}
                  checked={form.goals.includes(goal)}
                  label={GOAL_LABELS[goal]}
                  onChange={() => setForm((f) => ({ ...f, goals: toggleValue(f.goals, goal) }))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Czego teraz szukasz?</p>
            <div className="flex flex-col gap-2">
              {LOOKING_FOR_OPTIONS.map((value) => (
                <CheckRow
                  key={value}
                  checked={form.lookingFor.includes(value)}
                  label={LOOKING_FOR_LABELS[value]}
                  onChange={() => setForm((f) => ({ ...f, lookingFor: toggleValue(f.lookingFor, value) }))}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle
          title="Linki i kontakt"
          subtitle="Discord pozostaje prywatny i jest ujawniany dopiero po zaakceptowanym połączeniu."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="GitHub">
            <Input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." />
          </Field>
          <Field label="Portfolio">
            <Input value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://..." />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." />
          </Field>
          <Field label="Discord (prywatny)">
            <Input value={form.discordUsername} onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))} placeholder="np. codepanda" />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending || form.skills.length === 0 || form.lookingFor.length === 0} className="gap-2">
          <Save className="h-4 w-4" /> {pending ? "Zapisywanie…" : "Zapisz profil"}
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          : "border-neutral-200 text-neutral-600 hover:border-violet-300 dark:border-neutral-700 dark:text-neutral-300",
      )}
    >
      {children}
    </button>
  );
}

function TagButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-violet-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
      )}
    >
      {children}
    </button>
  );
}

function CheckRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm dark:border-neutral-700">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
