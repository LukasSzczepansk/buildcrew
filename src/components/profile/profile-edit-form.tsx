"use client";

import * as React from "react";
import { Link2, Save, Sparkles, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
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
import type { Commitment, Goal, Level, LookingFor, ProfileDiscipline, RoleType, WorkModePreference } from "@/db/schema";
import { PROFILE_DISCIPLINES, disciplineCopy } from "@/lib/profile-disciplines";
import { updateProfile } from "@/server/actions/profile";

type EditableProfile = {
  username: string;
  role: RoleType;
  disciplines: ProfileDiscipline[];
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

type EditTab = "basics" | "skills" | "collaboration" | "links";

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

export function ProfileEditForm({ initial }: { initial: EditableProfile }) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  const disciplineLabels = disciplineCopy(locale);
  const [form, setForm] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<EditTab>("basics");

  async function save() {
    setPending(true);
    const result = await updateProfile(form).catch(() => ({ error: copy("Nie udało się zapisać profilu.", "We couldn't save your profile.") }));
    setPending(false);
    if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
    toast.success(copy("Profil zapisany.", "Profile saved."));
  }

  return (
    <section className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
      <div className="border-b border-[var(--bc-line)] px-5 pt-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{copy("Edytuj profil", "Edit profile")}</h2>
            <p className="mt-1 text-[12px] leading-5 text-[var(--bc-faint)]">{copy("Dane są podzielone na krótkie sekcje, żeby łatwiej było utrzymać profil aktualny.", "Your details are split into shorter sections so the profile is easier to keep up to date.")}</p>
          </div>
          <Button onClick={save} disabled={pending || form.disciplines.length === 0 || form.skills.length === 0 || form.lookingFor.length === 0 || form.languages.length === 0} className="gap-2"><Save className="h-4 w-4" /> {pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz profil", "Save profile")}</Button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0">
          <EditTabButton active={activeTab === "basics"} onClick={() => setActiveTab("basics")} icon={UserRound}>{copy("Podstawy", "Basics")}</EditTabButton>
          <EditTabButton active={activeTab === "skills"} onClick={() => setActiveTab("skills")} icon={Sparkles}>{copy("Umiejętności", "Skills")}</EditTabButton>
          <EditTabButton active={activeTab === "collaboration"} onClick={() => setActiveTab("collaboration")} icon={UsersRound}>{copy("Współpraca", "Collaboration")}</EditTabButton>
          <EditTabButton active={activeTab === "links"} onClick={() => setActiveTab("links")} icon={Link2}>{copy("Widoczność i linki", "Visibility & links")}</EditTabButton>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {activeTab === "basics" ? (
          <div className="space-y-6">
            <FormSection title={copy("Podstawowe informacje", "Basics")} hint={copy("To pierwsze informacje, które inni widzą na Twoim profilu.", "These are the first details people see on your profile.")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={copy("Nick", "Username")}><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} maxLength={24} /></Field>
                <Field label={copy("Główna rola", "Primary role")}>
                  <div className="grid grid-cols-2 gap-2">{ROLE_OPTIONS.map((role) => <ChoiceButton key={role} active={form.role === role} onClick={() => setForm((f) => ({ ...f, role }))}>{labels.roles[role]}</ChoiceButton>)}</div>
                </Field>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">{copy("Obszary", "Areas")} <span className="text-[11px] font-normal text-[var(--bc-faint)]">{copy("(maks. 2)", "(up to 2)")}</span></p>
                <div className="flex flex-wrap gap-1.5">{PROFILE_DISCIPLINES.map((discipline) => <TagButton key={discipline} active={form.disciplines.includes(discipline)} onClick={() => setForm((f) => { if (f.disciplines.includes(discipline)) return { ...f, disciplines: f.disciplines.filter((item) => item !== discipline) }; if (f.disciplines.length >= 2) return f; return { ...f, disciplines: [...f.disciplines, discipline] }; })}>{disciplineLabels[discipline].label}</TagButton>)}</div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={copy("Nagłówek", "Headline")}><Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder={copy("np. Full-stack developer budujący SaaS-y", "e.g. Full-stack developer building SaaS products")} maxLength={100} /></Field>
                <Field label={copy("Krótko o Tobie", "About you")}><Textarea className="min-h-[104px]" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder={copy("Co budujesz i z kim chcesz współpracować?", "What do you build and who do you want to work with?")} maxLength={280} /></Field>
              </div>
            </FormSection>

            <FormSection title={copy("Lokalizacja i język", "Location and language")} hint={copy("Pomaga to dopasować osoby, z którymi realnie możesz współpracować.", "This helps match you with people you can realistically collaborate with.")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={copy("Kraj", "Country")}>
                  <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]">
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
          </div>
        ) : null}

        {activeTab === "skills" ? (
          <FormSection title={copy("Umiejętności", "Skills")} hint={copy("Wybierz rzeczy, z którymi naprawdę chcesz być kojarzony.", "Choose the things you actually want to be known for.")}>
            <div className="grid max-h-[34rem] gap-5 overflow-y-auto pr-2 lg:grid-cols-2">
              {Object.entries(SKILL_GROUPS).map(([group, skills]) => (
                <div key={group} className="rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{copy(group, group === "Integracje" ? "Integrations" : group)}</p>
                  <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <TagButton key={skill} active={form.skills.includes(skill)} onClick={() => setForm((f) => ({ ...f, skills: toggleValue(f.skills, skill) }))}>{skill}</TagButton>)}</div>
                </div>
              ))}
            </div>
          </FormSection>
        ) : null}

        {activeTab === "collaboration" ? (
          <FormSection title={copy("Współpraca", "Collaboration")} hint={copy("Pokaż, na jakie projekty, rozmowy i formy współpracy jesteś teraz otwarty.", "Tell people what kinds of projects, conversations and collaboration are relevant to you right now.")}>
            <div>
              <p className="mb-2 text-sm font-medium">{copy("Poziom", "Level")}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {LEVEL_OPTIONS.map((level) => (
                  <button key={level} type="button" onClick={() => setForm((f) => ({ ...f, level }))} className={cn("rounded-[9px] border p-4 text-left transition-colors", form.level === level ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]" : "border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] hover:border-[var(--bc-line-strong)]")}>
                    <span className="block text-sm font-medium">{labels.levels[level]}</span>
                    <span className="mt-1 block text-[12px] leading-4 text-[var(--bc-muted)]">{labels.levelDescriptions[level]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4">
                <p className="mb-3 text-sm font-medium">{copy("Czas w tygodniu", "Weekly availability")}</p>
                <div className="flex flex-wrap gap-1.5">{COMMITMENT_OPTIONS.map((commitment) => <TagButton key={commitment} active={form.weeklyHours === commitment} onClick={() => setForm((f) => ({ ...f, weeklyHours: commitment }))}>{labels.commitments[commitment]}</TagButton>)}</div>
              </div>
              <div className="rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4">
                <p className="mb-3 text-sm font-medium">{copy("Zainteresowania", "Interests")}</p>
                <div className="flex flex-wrap gap-1.5">{INTEREST_OPTIONS.map((interest) => <TagButton key={interest} active={form.interests.includes(interest)} onClick={() => setForm((f) => ({ ...f, interests: toggleValue(f.interests, interest) }))}>{interest}</TagButton>)}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[9px] border border-[var(--bc-line)] p-4"><p className="mb-2 text-sm font-medium">{copy("Cel", "Goals")}</p><div className="space-y-1">{GOAL_OPTIONS.map((goal) => <CheckRow key={goal} checked={form.goals.includes(goal)} label={labels.goals[goal]} onChange={() => setForm((f) => ({ ...f, goals: toggleValue(f.goals, goal) }))} />)}</div></div>
              <div className="rounded-[9px] border border-[var(--bc-line)] p-4"><p className="mb-2 text-sm font-medium">{copy("Otwartość", "Open to")}</p><div className="space-y-1">{LOOKING_FOR_OPTIONS.map((value) => <CheckRow key={value} checked={form.lookingFor.includes(value)} label={labels.lookingFor[value]} onChange={() => setForm((f) => ({ ...f, lookingFor: toggleValue(f.lookingFor, value) }))} />)}</div></div>
            </div>
          </FormSection>
        ) : null}

        {activeTab === "links" ? (
          <div className="space-y-6">
            <FormSection title={copy("Widoczność profilu", "Profile visibility")} hint={copy("Publiczny profil jest opcjonalny i możesz go wyłączyć w dowolnym momencie.", "Your public profile is optional and can be disabled at any time.")}>
              <label className="flex cursor-pointer items-start justify-between gap-5 rounded-[9px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--bc-ink)]">{copy("Publiczny profil zawodowy", "Public professional profile")}</span>
                  <span className="mt-1 block max-w-[760px] text-[12px] leading-5 text-[var(--bc-faint)]">{copy("Pozwala udostępniać profil poza BuildCrew i pokazywać projekty, portfolio oraz historię współpracy. Prywatne dane kontaktowe pozostają prywatne.", "Lets you share your profile outside BuildCrew and show projects, portfolio and collaboration history. Private contact details stay private.")}</span>
                </span>
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#a8d72f]" checked={form.publicProfile} onChange={(event) => setForm((f) => ({ ...f, publicProfile: event.target.checked }))} />
              </label>
            </FormSection>

            <FormSection title={copy("Linki i kontakt", "Links and contact")} hint={copy("Zewnętrzne linki są dodatkiem do projektów i portfolio w BuildCrew.", "External links complement your BuildCrew projects and portfolio.")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GitHub"><Input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." /></Field>
                <Field label="Portfolio"><Input value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://..." /></Field>
                <Field label="LinkedIn"><Input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." /></Field>
                <Field label="Discord"><Input value={form.discordUsername} onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))} placeholder={copy("np. codepanda", "e.g. codepanda")} /></Field>
              </div>
            </FormSection>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-5 py-3 sm:px-6">
        <p className="hidden text-[11px] text-[var(--bc-faint)] sm:block">{copy("Zmiany zapisują się dopiero po kliknięciu przycisku.", "Changes are saved only after clicking the button.")}</p>
        <Button onClick={save} disabled={pending || form.disciplines.length === 0 || form.skills.length === 0 || form.lookingFor.length === 0 || form.languages.length === 0} className="ml-auto gap-2"><Save className="h-4 w-4" /> {pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz profil", "Save profile")}</Button>
      </div>
    </section>
  );
}

function EditTabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof UserRound; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-[12px] font-medium transition-colors", active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]", active && "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--bc-accent-strong)]")}><Icon className="h-3.5 w-3.5" />{children}</button>;
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>{hint ? <p className="max-w-[620px] text-[12px] text-[var(--bc-faint)]">{hint}</p> : null}</div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label>{label}</Label>{children}</div>;
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-[7px] border px-3 py-2.5 text-sm font-medium transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{children}</button>;
}

function TagButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{children}</button>;
}

function CheckRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-2 text-sm hover:bg-[var(--bc-surface-subtle)]"><Checkbox checked={checked} onCheckedChange={onChange} /><span>{label}</span></label>;
}
