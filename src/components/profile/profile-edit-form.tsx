"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  publicProfile: boolean;
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
    if (result?.error) { toast.error(result.error); return; }
    toast.success("Profil zapisany.");
  }

  return (
    <div className="flex flex-col">
      <FormSection title="Podstawy">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nick"><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} maxLength={24} /></Field>
          <Field label="Główna rola">
            <div className="grid grid-cols-2 gap-2">{ROLE_OPTIONS.map((role) => <ChoiceButton key={role} active={form.role === role} onClick={() => setForm((f) => ({ ...f, role }))}>{ROLE_LABELS[role]}</ChoiceButton>)}</div>
          </Field>
        </div>
        <div className="mt-4"><Field label="Krótko o Tobie"><Textarea className="min-h-[90px]" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Co budujesz i z kim chcesz współpracować?" maxLength={280} /></Field></div>
      </FormSection>

      <FormSection title="Umiejętności">
        <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto pr-1">
          {Object.entries(SKILL_GROUPS).map(([group, skills]) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{group}</p>
              <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <TagButton key={skill} active={form.skills.includes(skill)} onClick={() => setForm((f) => ({ ...f, skills: toggleValue(f.skills, skill) }))}>{skill}</TagButton>)}</div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Dopasowanie">
        <div>
          <p className="mb-2 text-sm font-medium">Poziom</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {LEVEL_OPTIONS.map((level) => (
              <button key={level} type="button" onClick={() => setForm((f) => ({ ...f, level }))} className={cn("rounded-[7px] border p-3 text-left transition-colors", form.level === level ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]")}>
                <span className="block text-sm font-medium">{LEVEL_LABELS[level]}</span>
                <span className="mt-1 block text-[12px] leading-4 text-[var(--bc-muted)]">{LEVEL_DESCRIPTIONS[level]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5"><p className="mb-2 text-sm font-medium">Czas w tygodniu</p><div className="flex flex-wrap gap-1.5">{COMMITMENT_OPTIONS.map((commitment) => <TagButton key={commitment} active={form.weeklyHours === commitment} onClick={() => setForm((f) => ({ ...f, weeklyHours: commitment }))}>{COMMITMENT_LABELS[commitment]}</TagButton>)}</div></div>
        <div className="mt-5"><p className="mb-2 text-sm font-medium">Obszary</p><div className="flex flex-wrap gap-1.5">{INTEREST_OPTIONS.map((interest) => <TagButton key={interest} active={form.interests.includes(interest)} onClick={() => setForm((f) => ({ ...f, interests: toggleValue(f.interests, interest) }))}>{interest}</TagButton>)}</div></div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><p className="mb-2 text-sm font-medium">Cel</p><div className="space-y-2">{GOAL_OPTIONS.map((goal) => <CheckRow key={goal} checked={form.goals.includes(goal)} label={GOAL_LABELS[goal]} onChange={() => setForm((f) => ({ ...f, goals: toggleValue(f.goals, goal) }))} />)}</div></div>
          <div><p className="mb-2 text-sm font-medium">Szukam teraz</p><div className="space-y-2">{LOOKING_FOR_OPTIONS.map((value) => <CheckRow key={value} checked={form.lookingFor.includes(value)} label={LOOKING_FOR_LABELS[value]} onChange={() => setForm((f) => ({ ...f, lookingFor: toggleValue(f.lookingFor, value) }))} />)}</div></div>
        </div>
      </FormSection>

      <FormSection title="Widoczność profilu" hint="Publiczny profil jest opcjonalny i możesz go wyłączyć w dowolnym momencie.">
        <label className="flex cursor-pointer items-start justify-between gap-5 border-y border-[var(--bc-line)] py-3.5">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[var(--bc-ink)]">Publiczny profil buildera</span>
            <span className="mt-0.5 block max-w-[680px] text-[12px] leading-4 text-[var(--bc-faint)]">Pozwala udostępniać profil poza BuildCrew i pojawiać się w publicznym portfolio współpracy. Discord i prywatne dane kontaktowe nadal nie są publiczne.</span>
          </span>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]" checked={form.publicProfile} onChange={(event) => setForm((f) => ({ ...f, publicProfile: event.target.checked }))} />
        </label>
      </FormSection>

      <FormSection title="Linki i kontakt" hint="Discord jest prywatny do czasu zaakceptowanego połączenia.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub"><Input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." /></Field>
          <Field label="Portfolio"><Input value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://..." /></Field>
          <Field label="LinkedIn"><Input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." /></Field>
          <Field label="Discord"><Input value={form.discordUsername} onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))} placeholder="np. codepanda" /></Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 mt-2 flex justify-end border-t border-[var(--bc-line)] bg-[var(--bc-canvas)]/95 py-4 backdrop-blur-sm">
        <Button onClick={save} disabled={pending || form.skills.length === 0 || form.lookingFor.length === 0} className="gap-2"><Save className="h-4 w-4" /> {pending ? "Zapisywanie…" : "Zapisz profil"}</Button>
      </div>
    </div>
  );
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="border-t border-[var(--bc-line)] py-6 first:border-t-0 first:pt-0"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>{hint ? <p className="text-[12px] text-[var(--bc-faint)]">{hint}</p> : null}</div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label>{label}</Label>{children}</div>;
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-[7px] border px-3 py-2 text-sm font-medium transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{children}</button>;
}

function TagButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{children}</button>;
}

function CheckRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <label className="flex cursor-pointer items-center gap-2 border-b border-[var(--bc-line)] py-2 text-sm last:border-b-0"><Checkbox checked={checked} onCheckedChange={onChange} /><span>{label}</span></label>;
}
