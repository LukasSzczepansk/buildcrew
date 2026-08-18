"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  COMMITMENT_OPTIONS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  LEVEL_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ROLE_OPTIONS,
  SKILL_GROUPS,
} from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import {
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  WORK_MODE_OPTIONS,
  internationalLabels,
} from "@/lib/international";
import { countryLabel } from "@/lib/countries";
import type { Commitment, Goal, Level, LookingFor, RoleType, WorkModePreference } from "@/db/schema";
import { updateProfile } from "@/server/actions/profile";

type EditableProfile = {
  username: string;
  role: RoleType;
  level: Level;
  weeklyHours: Commitment;
  bio: string;
  headline: string;
  country: string;
  city: string;
  languages: string[];
  workModePreference: WorkModePreference;
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
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const result = await updateProfile(form).catch(() => ({ error: copy("Nie udało się zapisać profilu.", "We couldn't save your profile.") }));
    setPending(false);
    if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
    toast.success(copy("Profil zapisany.", "Profile saved."));
  }

  return (
    <div className="flex flex-col">
      <FormSection title={copy("Podstawowe informacje", "Basics")} hint={copy("Uzupełnij profil w języku, w którym chcesz prezentować się innym osobom.", "Write your profile in the language you want to use when presenting yourself to other builders.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy("Nick", "Username")}><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} maxLength={24} /></Field>
          <Field label={copy("Główna rola", "Primary role")}>
            <div className="grid grid-cols-2 gap-2">{ROLE_OPTIONS.map((role) => <ChoiceButton key={role} active={form.role === role} onClick={() => setForm((f) => ({ ...f, role }))}>{labels.roles[role]}</ChoiceButton>)}</div>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={copy("Nagłówek", "Headline")}><Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder={copy("np. Full-stack developer budujący SaaS-y", "e.g. Full-stack developer building SaaS products")} maxLength={100} /></Field>
          <Field label={copy("Krótko o Tobie", "About you")}><Textarea className="min-h-[90px]" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder={copy("Co budujesz i z kim chcesz współpracować?", "What do you build and who do you want to work with?")} maxLength={280} /></Field>
        </div>
      </FormSection>

      <FormSection title={copy("Lokalizacja i język", "Location and language")} hint={copy("Te dane pomagają dopasować osoby, z którymi realnie możesz współpracować.", "These details help match you with people you can realistically collaborate with.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy("Kraj", "Country")}>
            <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="h-10 w-full rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm">
              <option value="">{copy("Wybierz kraj", "Select country")}</option>
              {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{countryLabel(country)}</option>)}
            </select>
          </Field>
          <Field label={copy("Miasto", "City")}><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder={copy("np. Warszawa", "e.g. Amsterdam")} /></Field>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">{copy("Języki współpracy", "Collaboration languages")}</p>
          <div className="flex flex-wrap gap-1.5">{LANGUAGE_OPTIONS.map((language) => <TagButton key={language} active={form.languages.includes(language)} onClick={() => setForm((f) => ({ ...f, languages: toggleValue(f.languages, language) }))}>{language}</TagButton>)}</div>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">{copy("Preferowany tryb pracy", "Preferred work mode")}</p>
          <div className="flex flex-wrap gap-1.5">{WORK_MODE_OPTIONS.map((mode) => <TagButton key={mode} active={form.workModePreference === mode} onClick={() => setForm((f) => ({ ...f, workModePreference: mode }))}>{intl.workMode[mode]}</TagButton>)}</div>
        </div>
      </FormSection>

      <FormSection title={copy("Umiejętności", "Skills")}>
        <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto pr-1">
          {Object.entries(SKILL_GROUPS).map(([group, skills]) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{copy(group === "Integracje" ? "Integrations" : group, group === "Integracje" ? "Integrations" : group)}</p>
              <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <TagButton key={skill} active={form.skills.includes(skill)} onClick={() => setForm((f) => ({ ...f, skills: toggleValue(f.skills, skill) }))}>{skill}</TagButton>)}</div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title={copy("Możliwości", "Opportunities")} hint={copy("Pokaż innym, na jakie projekty, współprace i możliwości jesteś teraz otwarty.", "Tell people what kinds of conversations and opportunities are relevant to you right now.")}>
        <div>
          <p className="mb-2 text-sm font-medium">{copy("Poziom", "Level")}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {LEVEL_OPTIONS.map((level) => (
              <button key={level} type="button" onClick={() => setForm((f) => ({ ...f, level }))} className={cn("rounded-[7px] border p-3 text-left transition-colors", form.level === level ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]")}>
                <span className="block text-sm font-medium">{labels.levels[level]}</span>
                <span className="mt-1 block text-[12px] leading-4 text-[var(--bc-muted)]">{labels.levelDescriptions[level]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5"><p className="mb-2 text-sm font-medium">{copy("Czas w tygodniu", "Weekly availability")}</p><div className="flex flex-wrap gap-1.5">{COMMITMENT_OPTIONS.map((commitment) => <TagButton key={commitment} active={form.weeklyHours === commitment} onClick={() => setForm((f) => ({ ...f, weeklyHours: commitment }))}>{labels.commitments[commitment]}</TagButton>)}</div></div>
        <div className="mt-5"><p className="mb-2 text-sm font-medium">{copy("Zainteresowania", "Interests")}</p><div className="flex flex-wrap gap-1.5">{INTEREST_OPTIONS.map((interest) => <TagButton key={interest} active={form.interests.includes(interest)} onClick={() => setForm((f) => ({ ...f, interests: toggleValue(f.interests, interest) }))}>{interest}</TagButton>)}</div></div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><p className="mb-2 text-sm font-medium">{copy("Cel", "Goals")}</p><div className="space-y-2">{GOAL_OPTIONS.map((goal) => <CheckRow key={goal} checked={form.goals.includes(goal)} label={labels.goals[goal]} onChange={() => setForm((f) => ({ ...f, goals: toggleValue(f.goals, goal) }))} />)}</div></div>
          <div><p className="mb-2 text-sm font-medium">{copy("Otwartość", "Open to")}</p><div className="space-y-2">{LOOKING_FOR_OPTIONS.map((value) => <CheckRow key={value} checked={form.lookingFor.includes(value)} label={labels.lookingFor[value]} onChange={() => setForm((f) => ({ ...f, lookingFor: toggleValue(f.lookingFor, value) }))} />)}</div></div>
        </div>
      </FormSection>

      <FormSection title={copy("Widoczność profilu", "Profile visibility")} hint={copy("Publiczny profil jest opcjonalny i możesz go wyłączyć w dowolnym momencie.", "Your public profile is optional and can be disabled at any time.")}>
        <label className="flex cursor-pointer items-start justify-between gap-5 border-y border-[var(--bc-line)] py-3.5">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[var(--bc-ink)]">{copy("Publiczny profil zawodowy", "Public professional profile")}</span>
            <span className="mt-0.5 block max-w-[680px] text-[12px] leading-4 text-[var(--bc-faint)]">{copy("Pozwala udostępniać profil poza BuildCrew, być znajdowanym do projektów i możliwości zawodowych oraz budować publiczną historię współpracy. Discord i prywatne dane kontaktowe pozostają prywatne.", "Lets you share your profile outside BuildCrew, get discovered for projects and professional opportunities, and build a public track record. Discord and private contact details remain private.")}</span>
          </span>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]" checked={form.publicProfile} onChange={(event) => setForm((f) => ({ ...f, publicProfile: event.target.checked }))} />
        </label>
      </FormSection>

      <FormSection title={copy("Linki i kontakt", "Links and contact")} hint={copy("Discord jest prywatny do czasu zaakceptowanego połączenia.", "Discord stays private until the appropriate contact flow.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub"><Input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." /></Field>
          <Field label="Portfolio"><Input value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://..." /></Field>
          <Field label="LinkedIn"><Input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." /></Field>
          <Field label="Discord"><Input value={form.discordUsername} onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))} placeholder={copy("np. codepanda", "e.g. codepanda")} /></Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 mt-2 flex justify-end border-t border-[var(--bc-line)] bg-[var(--bc-canvas)]/95 py-4 backdrop-blur-sm">
        <Button onClick={save} disabled={pending || form.skills.length === 0 || form.lookingFor.length === 0 || form.languages.length === 0} className="gap-2"><Save className="h-4 w-4" /> {pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz profil", "Save profile")}</Button>
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
