"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ImagePlus, X } from "lucide-react";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  COMMITMENT_OPTIONS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  LEVEL_OPTIONS,
  LOOKING_FOR_OPTIONS,
} from "@/lib/constants";
import type { Commitment, Goal, Level, LookingFor, ProfileDiscipline, RoleType, WorkModePreference } from "@/db/schema";
import { completeOnboarding } from "@/server/actions/profile";
import { createPortfolioItem } from "@/server/actions/portfolio";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, WORK_MODE_OPTIONS, internationalLabels } from "@/lib/international";
import { countryLabel } from "@/lib/countries";
import {
  PROFILE_DISCIPLINES,
  disciplineCopy,
  portfolioPromptForDisciplines,
  roleOptionsForDisciplines,
  skillsForDisciplines,
} from "@/lib/profile-disciplines";

const TOTAL_STEPS = 5;
const DRAFT_KEY = "buildcrew-onboarding-draft-v4";
const LEGACY_DRAFT_KEYS = ["buildcrew-onboarding-draft-v3", "buildcrew-onboarding-draft-v2"];
const MAX_PORTFOLIO_FILES = 3;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 475 * 1024;

type LocalImage = { id: string; dataUrl: string; preview: string; name: string };

type FormState = {
  username: string;
  disciplines: ProfileDiscipline[];
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

type StoredDraft = { version: 4; step: number; form: FormState; updatedAt: string };

const emptyForm: FormState = {
  username: "",
  disciplines: [],
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

function normalizeStep(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(TOTAL_STEPS, Math.max(1, Math.round(parsed)));
}

function toggleValue<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number, errorMessage: string) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(errorMessage)), "image/webp", quality));
}

async function prepareImage(file: File, copy: (pl: string, en: string) => string) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(copy("Dodaj JPG, PNG lub WebP.", "Add a JPG, PNG or WebP image."));
  if (file.size > MAX_SOURCE_BYTES) throw new Error(copy("Jeden plik może mieć maksymalnie 10 MB.", "A source image can be at most 10 MB."));
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(copy("Nie udało się odczytać obrazu.", "Could not read the image.")));
      image.src = url;
    });
    const sourceW = image.naturalWidth || image.width;
    const sourceH = image.naturalHeight || image.height;
    if (Math.min(sourceW, sourceH) < 120) throw new Error(copy("Obraz jest zbyt mały.", "The image is too small."));
    const scale = Math.min(1, 1800 / Math.max(sourceW, sourceH));
    const width = Math.max(1, Math.round(sourceW * scale));
    const height = Math.max(1, Math.round(sourceH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error(copy("Nie udało się przygotować obrazu.", "Could not prepare the image."));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    let blob: Blob | null = null;
    for (const quality of [0.88, 0.78, 0.68, 0.58, 0.48]) {
      blob = await canvasToWebp(canvas, quality, copy("Nie udało się przygotować obrazu.", "Could not prepare the image."));
      if (blob.size <= MAX_OUTPUT_BYTES) break;
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new Error(copy("Ten screen jest zbyt złożony. Spróbuj mniejszego obrazu.", "This screenshot is too complex. Try a smaller image."));
    return { dataUrl: await blobToDataUrl(blob), preview: URL.createObjectURL(blob) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function OnboardingWizard() {
  const router = useRouter();
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const intl = internationalLabels(locale);
  const disciplineLabels = disciplineCopy(locale);
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [draftReady, setDraftReady] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [portfolioTitle, setPortfolioTitle] = React.useState("");
  const [portfolioDescription, setPortfolioDescription] = React.useState("");
  const [portfolioImages, setPortfolioImages] = React.useState<LocalImage[]>([]);
  const portfolioSavedRef = React.useRef(false);
  const portfolioInputRef = React.useRef<HTMLInputElement | null>(null);

  const roleOptions = React.useMemo(() => roleOptionsForDisciplines(form.disciplines), [form.disciplines]);
  const skillOptions = React.useMemo(() => skillsForDisciplines(form.disciplines), [form.disciplines]);
  const portfolioPrompt = portfolioPromptForDisciplines(form.disciplines, locale);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredDraft>;
        if (parsed.form) {
          setForm({ ...emptyForm, ...parsed.form, disciplines: parsed.form.disciplines ?? [] });
          setStep(normalizeStep(parsed.step));
          setSavedAt(typeof parsed.updatedAt === "string" ? parsed.updatedAt : null);
          return;
        }
      }
      for (const key of LEGACY_DRAFT_KEYS) {
        const legacyRaw = window.localStorage.getItem(key);
        if (!legacyRaw) continue;
        const parsed = JSON.parse(legacyRaw) as Partial<StoredDraft> & Partial<FormState>;
        const legacyForm = parsed.form ?? parsed;
        const legacyRole = legacyForm.role;
        const inferred: ProfileDiscipline[] = legacyRole === "UI_UX" ? ["DESIGN"] : legacyRole === "MARKETING" ? ["MARKETING_GROWTH"] : legacyRole === "PRODUCT" ? ["PRODUCT"] : legacyRole === "AI_ML" ? ["DATA_AI"] : legacyRole ? ["DEVELOPMENT"] : [];
        setForm({ ...emptyForm, ...legacyForm, disciplines: inferred });
        break;
      }
    } catch {
      // A broken local draft should never block onboarding.
    } finally {
      setForm((current) => current.languages.length ? current : { ...current, languages: [locale === "pl" ? "Polski" : "English"] });
      setDraftReady(true);
    }
  }, [locale]);

  React.useEffect(() => {
    if (!form.disciplines.length) return;
    if (form.role && roleOptions.includes(form.role)) return;
    setForm((current) => ({ ...current, role: roleOptions.length === 1 ? roleOptions[0] : "" }));
  }, [form.disciplines, form.role, roleOptions]);

  const saveDraftNow = React.useCallback(() => {
    if (!draftReady) return;
    const updatedAt = new Date().toISOString();
    const draft: StoredDraft = { version: 4, step, form, updatedAt };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      LEGACY_DRAFT_KEYS.forEach((key) => window.localStorage.removeItem(key));
      setSavedAt(updatedAt);
    } catch {
      // localStorage may be unavailable in private browsing.
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
    if (step === 1) return form.username.trim().length >= 2 && /^[a-zA-Z0-9_]+$/.test(form.username.trim()) && form.disciplines.length >= 1 && form.disciplines.length <= 2;
    if (step === 2) return !!form.role && form.skills.length >= 1 && !!form.level;
    if (step === 3) return !!form.weeklyHours && form.lookingFor.length >= 1;
    if (step === 4) return form.languages.length >= 1;
    return true;
  }, [form, step]);

  function toggleDiscipline(discipline: ProfileDiscipline) {
    setForm((current) => {
      if (current.disciplines.includes(discipline)) return { ...current, disciplines: current.disciplines.filter((item) => item !== discipline) };
      if (current.disciplines.length >= 2) {
        toast.message(copy("Możesz wybrać maksymalnie 2 obszary.", "You can choose up to 2 areas."));
        return current;
      }
      return { ...current, disciplines: [...current.disciplines, discipline] };
    });
  }

  async function addPortfolioFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const remaining = MAX_PORTFOLIO_FILES - portfolioImages.length;
    if (remaining <= 0) return;
    try {
      const prepared: LocalImage[] = [];
      for (const file of files.slice(0, remaining)) {
        const image = await prepareImage(file, copy);
        prepared.push({ id: crypto.randomUUID(), dataUrl: image.dataUrl, preview: image.preview, name: file.name });
      }
      setPortfolioImages((current) => [...current, ...prepared]);
      if (files.length > remaining) toast.message(copy(`W onboardingu możesz dodać do ${MAX_PORTFOLIO_FILES} screenów. Więcej dodasz później w profilu.`, `You can add up to ${MAX_PORTFOLIO_FILES} screenshots during onboarding. Add more later from your profile.`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy("Nie udało się dodać screena.", "Could not add the screenshot."));
    }
  }

  function removePortfolioImage(id: string) {
    setPortfolioImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit() {
    setPending(true);
    try {
      if (portfolioImages.length && !portfolioSavedRef.current) {
        const result = await createPortfolioItem({
          title: portfolioTitle.trim() || copy("Pierwsza praca", "First portfolio work"),
          description: portfolioDescription.trim(),
          role: form.role ? labels.roles[form.role] : undefined,
          tools: form.skills.slice(0, 12),
          images: portfolioImages.map((image) => ({ dataUrl: image.dataUrl })),
        });
        if (result.error) {
          toast.error(copy("Nie udało się zapisać pracy w portfolio. Możesz pominąć screeny i dodać je później.", "We couldn't save your portfolio work. You can remove the screenshots and add them later."));
          setPending(false);
          return;
        }
        portfolioSavedRef.current = true;
      }

      const result = await completeOnboarding({
        username: form.username.trim(),
        disciplines: form.disciplines,
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
          LEGACY_DRAFT_KEYS.forEach((key) => window.localStorage.removeItem(key));
        } catch {}
        throw err;
      }
      setPending(false);
      toast.error(copy("Nie udało się zapisać profilu. Spróbuj ponownie.", "We couldn't save your profile. Please try again."));
    }
  }

  function next() {
    if (step === TOTAL_STEPS) { void handleSubmit(); return; }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exitOnboarding() {
    saveDraftNow();
    router.push("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between gap-4 text-[13px] text-[var(--bc-muted)]">
          <span>{copy(`Krok ${step} z ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`)}</span>
          <div className="flex items-center gap-3"><span>{Math.round((step / TOTAL_STEPS) * 100)}%</span><button type="button" onClick={exitOnboarding} className="font-medium underline-offset-4 hover:text-[var(--bc-ink)] hover:underline">{copy("Dokończ później", "Finish later")}</button></div>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
        <p className="mt-2 text-[12px] leading-4 text-[var(--bc-faint)]">{copy("Dane formularza zapisują się automatycznie na tym urządzeniu. Dodane screeny nie są zapisywane w szkicu.", "Form fields are saved automatically on this device. Uploaded screenshots are not stored in the local draft.")}</p>
      </div>

      <div className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 sm:p-7">
        {step === 1 ? <StepShell title={copy("Kim jesteś?", "What do you do?")} subtitle={copy("Wybierz 1 lub 2 obszary. Na tej podstawie dopasujemy kolejne pytania, profil i późniejsze rekomendacje.", "Choose 1 or 2 areas. We'll adapt the next questions, your profile and future recommendations around them.")}>
          <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
            <div><Label htmlFor="username">{copy("Nick", "Username")}</Label><Input id="username" className="mt-2" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder={copy("np. CodePanda", "e.g. CodePanda")} autoFocus /><p className="mt-2 text-[12px] leading-4 text-[var(--bc-faint)]">{copy("Litery, cyfry i podkreślenia. Nick będzie publiczny.", "Letters, numbers and underscores. Your username will be public.")}</p></div>
            <div><div className="flex items-center justify-between gap-3"><Label>{copy("Twoje obszary", "Your areas")}</Label><span className="text-[11px] text-[var(--bc-faint)]">{form.disciplines.length}/2</span></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{PROFILE_DISCIPLINES.map((discipline) => <DisciplineTile key={discipline} active={form.disciplines.includes(discipline)} title={disciplineLabels[discipline].label} description={disciplineLabels[discipline].description} onClick={() => toggleDiscipline(discipline)} />)}</div></div>
          </div>
        </StepShell> : null}

        {step === 2 ? <StepShell title={specializationTitle(form.disciplines, locale)} subtitle={specializationSubtitle(form.disciplines, locale)}>
          <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div><Label>{copy("Główna specjalizacja", "Primary specialization")}</Label><div className="mt-2 grid gap-2">{roleOptions.map((role) => <SelectableTile key={role} active={form.role === role} label={labels.roles[role]} onClick={() => setForm((current) => ({ ...current, role }))} />)}</div><div className="mt-6"><Label>{copy("Doświadczenie", "Experience")}</Label><div className="mt-2 space-y-2">{LEVEL_OPTIONS.map((level) => <button key={level} type="button" onClick={() => setForm((current) => ({ ...current, level }))} className={cn("w-full rounded-[6px] border px-3 py-3 text-left", form.level === level ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] ring-1 ring-[var(--bc-accent-strong)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]")}><span className="block text-sm font-medium">{labels.levels[level]}</span><span className="mt-0.5 block text-[11px] leading-4 text-[var(--bc-muted)]">{labels.levelDescriptions[level]}</span></button>)}</div></div></div>
            <div><div className="flex items-center justify-between gap-3"><Label>{skillsLabel(form.disciplines, locale)}</Label><span className="text-[11px] text-[var(--bc-faint)]">{copy("wybierz te, których naprawdę używasz", "choose the ones you actually use")}</span></div><div className="mt-3 flex max-h-[520px] flex-wrap content-start gap-2 overflow-y-auto pr-1">{skillOptions.map((skill) => <TagToggle key={skill} active={form.skills.includes(skill)} label={skill} onClick={() => setForm((current) => ({ ...current, skills: toggleValue(current.skills, skill) }))} />)}</div></div>
          </div>
        </StepShell> : null}

        {step === 3 ? <StepShell title={copy("Czego szukasz na BuildCrew?", "What are you looking for on BuildCrew?")} subtitle={copy("Nie chodzi tylko o pracę. Zaznacz, czy chcesz budować, dołączyć do projektu, dzielić się wiedzą, poznawać ludzi albo rozwijać własny pomysł.", "This isn't just about jobs. Tell us whether you want to build, join projects, exchange knowledge, meet people or develop your own idea.")}>
          <div className="grid gap-7 md:grid-cols-2">
            <div><Label>{copy("Na co jesteś teraz otwarty/a?", "What are you open to right now?")}</Label><div className="mt-2 space-y-2">{LOOKING_FOR_OPTIONS.map((option) => <CheckTile key={option} checked={form.lookingFor.includes(option)} label={labels.lookingFor[option]} onChange={() => setForm((current) => ({ ...current, lookingFor: toggleValue(current.lookingFor, option) }))} />)}</div></div>
            <div className="space-y-6"><div><Label>{copy("Ile czasu masz tygodniowo?", "How much time do you have each week?")}</Label><div className="mt-2 grid grid-cols-2 gap-2">{COMMITMENT_OPTIONS.map((commitment) => <SelectableTile key={commitment} active={form.weeklyHours === commitment} label={labels.commitments[commitment]} onClick={() => setForm((current) => ({ ...current, weeklyHours: commitment }))} />)}</div></div><div><Label>{copy("Co chcesz dzięki temu osiągnąć?", "What do you want to get from it?")}</Label><div className="mt-2 flex flex-wrap gap-2">{GOAL_OPTIONS.map((goal) => <TagToggle key={goal} active={form.goals.includes(goal)} label={labels.goals[goal]} onClick={() => setForm((current) => ({ ...current, goals: toggleValue(current.goals, goal) }))} />)}</div></div></div>
          </div>
        </StepShell> : null}

        {step === 4 ? <StepShell title={copy("Jak chcesz współpracować?", "How do you want to collaborate?")} subtitle={copy("Język, lokalizacja, tryb pracy i zainteresowania pomagają znaleźć ludzi, z którymi faktycznie będzie Ci po drodze.", "Language, location, work mode and interests help us find people you'll realistically work well with.")}>
          <div className="space-y-7">
            <div className="grid gap-5 sm:grid-cols-2"><div><Label>{copy("Języki współpracy", "Collaboration languages")}</Label><div className="mt-2 flex flex-wrap gap-2">{LANGUAGE_OPTIONS.map((language) => <TagToggle key={language} active={form.languages.includes(language)} label={language} onClick={() => setForm((current) => ({ ...current, languages: toggleValue(current.languages, language) }))} />)}</div></div><div><Label>{copy("Preferowany tryb pracy", "Preferred work mode")}</Label><div className="mt-2 grid grid-cols-2 gap-2">{WORK_MODE_OPTIONS.map((mode) => <SelectableTile key={mode} active={form.workModePreference === mode} label={intl.workMode[mode]} onClick={() => setForm((current) => ({ ...current, workModePreference: mode }))} />)}</div></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label>{copy("Kraj", "Country")}</Label><select value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="mt-2 h-10 w-full rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm"><option value="">{copy("Wybierz kraj", "Select country")}</option>{COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{countryLabel(country)}</option>)}</select></div><div><Label>{copy("Miasto (opcjonalnie)", "City (optional)")}</Label><Input className="mt-2" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder={copy("np. Warszawa", "e.g. Amsterdam")} /></div></div>
            <div><Label>{copy("Zainteresowania", "Interests")}</Label><div className="mt-2 flex flex-wrap gap-2">{INTEREST_OPTIONS.map((interest) => <TagToggle key={interest} active={form.interests.includes(interest)} label={interest} onClick={() => setForm((current) => ({ ...current, interests: toggleValue(current.interests, interest) }))} />)}</div></div>
            <div><Label>{copy("Nagłówek profilu (opcjonalnie)", "Headline (optional)")}</Label><Input className="mt-2" value={form.headline} onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))} maxLength={100} placeholder={headlinePlaceholder(form.disciplines, locale)} /></div>
          </div>
        </StepShell> : null}

        {step === 5 ? <StepShell title={portfolioPrompt.title} subtitle={portfolioPrompt.description}>
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2"><div><Label>{copy("Tytuł pracy (opcjonalnie)", "Work title (optional)")}</Label><Input className="mt-2" value={portfolioTitle} onChange={(event) => setPortfolioTitle(event.target.value)} placeholder={portfolioPrompt.example} maxLength={90} /></div><div><Label>{copy("Krótki opis (opcjonalnie)", "Short description (optional)")}</Label><Textarea className="mt-2 min-h-20" value={portfolioDescription} onChange={(event) => setPortfolioDescription(event.target.value)} placeholder={workDescriptionPlaceholder(form.disciplines, locale)} maxLength={500} /></div></div>
              <div><div className="flex items-center justify-between gap-3"><div><Label>{copy("Screeny pracy", "Work screenshots")}</Label><p className="mt-1 text-[11px] text-[var(--bc-faint)]">{copy("Opcjonalnie, maks. 3 teraz. Więcej dodasz później w Portfolio.", "Optional, up to 3 now. Add more later from Portfolio.")}</p></div><Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => portfolioInputRef.current?.click()}><ImagePlus className="h-4 w-4" />{copy("Dodaj screen", "Add screenshot")}</Button><input ref={portfolioInputRef} className="hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPortfolioFiles} /></div>{portfolioImages.length ? <div className="mt-3 grid gap-3 sm:grid-cols-3">{portfolioImages.map((image, index) => <div key={image.id} className="relative border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)]"><img src={image.preview} alt="" className="aspect-[16/10] w-full object-cover object-top" /><div className="flex items-center justify-between gap-2 border-t border-[var(--bc-line)] px-2 py-1.5"><span className="truncate text-[10px] text-[var(--bc-faint)]">{index === 0 ? copy("OKŁADKA", "COVER") : `${index + 1}.`} · {image.name}</span><button type="button" onClick={() => removePortfolioImage(image.id)} className="shrink-0 p-1 text-[var(--bc-danger)]" aria-label={copy("Usuń screen", "Remove screenshot")}><X className="h-3.5 w-3.5" /></button></div></div>)}</div> : <button type="button" onClick={() => portfolioInputRef.current?.click()} className="mt-3 flex min-h-28 w-full items-center justify-center border border-dashed border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] px-4 text-center text-[12px] text-[var(--bc-muted)]"><span><ImagePlus className="mx-auto mb-2 h-5 w-5" />{copy("Dodaj screen bezpośrednio do profilu BuildCrew", "Add a screenshot directly to your BuildCrew profile")}</span></button>}</div>
              <div className="border-t border-[var(--bc-line)] pt-5"><p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Linki - opcjonalnie", "Links - optional")}</p><div className="grid gap-3 sm:grid-cols-2"><Field id="github" label="GitHub" placeholder="https://github.com/yourname" value={form.githubUrl} onChange={(value) => setForm((current) => ({ ...current, githubUrl: value }))} /><Field id="portfolio" label={copy("Zewnętrzne portfolio", "External portfolio")} placeholder="https://behance.net/..." value={form.portfolioUrl} onChange={(value) => setForm((current) => ({ ...current, portfolioUrl: value }))} /><Field id="linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={(value) => setForm((current) => ({ ...current, linkedinUrl: value }))} /><Field id="discord" label="Discord" placeholder={copy("np. codepanda123", "e.g. codepanda123")} value={form.discordUsername} onChange={(value) => setForm((current) => ({ ...current, discordUsername: value }))} /></div></div>
            </div>
            <div className="border-t border-[var(--bc-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Podgląd profilu", "Profile preview")}</p><p className="mt-2 text-[19px] font-semibold">{form.username || copy("Twój nick", "Your username")}</p><p className="mt-1 text-sm text-[var(--bc-muted)]">{form.role ? labels.roles[form.role] : copy("Specjalizacja", "Specialization")}{form.level ? ` · ${labels.levels[form.level]}` : ""}</p><div className="mt-3 flex flex-wrap gap-1.5">{form.disciplines.map((discipline) => <span key={discipline} className="border border-[var(--bc-line)] px-2 py-1 text-[10px] font-medium text-[var(--bc-muted)]">{disciplineLabels[discipline].label}</span>)}</div><div className="mt-5 space-y-3 text-[12px] leading-5 text-[var(--bc-muted)]"><p><strong className="text-[var(--bc-ink)]">{copy("Umiejętności:", "Skills:")}</strong> {form.skills.slice(0, 7).join(" · ")}</p><p><strong className="text-[var(--bc-ink)]">{copy("Dostępność:", "Availability:")}</strong> {form.weeklyHours ? labels.commitments[form.weeklyHours] : "-"}</p><p><strong className="text-[var(--bc-ink)]">{copy("Szukam:", "Looking for:")}</strong> {form.lookingFor.slice(0, 3).map((item) => labels.lookingFor[item]).join(" · ") || "-"}</p>{portfolioImages[0] ? <div className="pt-2"><p className="mb-2 font-medium text-[var(--bc-ink)]">Portfolio</p><img src={portfolioImages[0].preview} alt="" className="aspect-[16/10] w-full border border-[var(--bc-line)] object-cover object-top" /></div> : null}</div></div>
          </div>
        </StepShell> : null}
      </div>

      <div className="flex items-center justify-between gap-3"><Button variant="ghost" onClick={back} disabled={step === 1 || pending}>{copy("Wstecz", "Back")}</Button><div className="flex items-center gap-3"><span className="hidden text-[12px] text-[var(--bc-faint)] sm:inline">{savedAt ? copy("Szkic zapisany.", "Draft saved.") : copy("Szkic zapisuje się automatycznie.", "Draft saves automatically.")}</span><Button onClick={next} disabled={!canProceed || pending}>{pending ? copy("Tworzymy profil…", "Creating profile…") : step === TOTAL_STEPS ? copy("Zapisz i pokaż dopasowania", "Save and show matches") : copy("Dalej", "Next")}</Button></div></div>
    </div>
  );
}

function specializationTitle(disciplines: ProfileDiscipline[], locale: "pl" | "en") {
  if (disciplines.includes("DESIGN")) return locale === "en" ? "Your design specialization" : "Twoja specjalizacja w designie";
  if (disciplines.includes("DEVELOPMENT")) return locale === "en" ? "Your development stack" : "Twój kierunek i stack";
  if (disciplines.includes("DATA_AI")) return locale === "en" ? "Your data / AI specialization" : "Twoja specjalizacja Data / AI";
  if (disciplines.includes("MARKETING_GROWTH")) return locale === "en" ? "Your growth specialization" : "Twoja specjalizacja marketingowa";
  if (disciplines.includes("FOUNDER_BUSINESS")) return locale === "en" ? "How do you build products?" : "Jak budujesz produkty?";
  return locale === "en" ? "Your specialization" : "Twoja specjalizacja";
}

function specializationSubtitle(disciplines: ProfileDiscipline[], locale: "pl" | "en") {
  if (disciplines.includes("DESIGN")) return locale === "en" ? "Choose the kind of design work you actually do and the tools you use." : "Wybierz rodzaj pracy projektowej, którą naprawdę wykonujesz, oraz narzędzia, których używasz.";
  if (disciplines.includes("DEVELOPMENT")) return locale === "en" ? "Choose your main engineering role and the technologies you want to use with other builders." : "Wybierz główną rolę techniczną i technologie, z których chcesz korzystać przy wspólnym budowaniu.";
  if (disciplines.includes("FOUNDER_BUSINESS")) return locale === "en" ? "Tell us which product and business skills you bring to a team." : "Pokaż, jakie kompetencje produktowe i biznesowe wnosisz do zespołu.";
  return locale === "en" ? "Choose your primary specialization and the skills that best describe your real work." : "Wybierz główną specjalizację i umiejętności, które najlepiej opisują Twoją realną pracę.";
}

function skillsLabel(disciplines: ProfileDiscipline[], locale: "pl" | "en") {
  if (disciplines.includes("DESIGN")) return locale === "en" ? "Design skills and tools" : "Umiejętności i narzędzia designerskie";
  if (disciplines.includes("DEVELOPMENT")) return locale === "en" ? "Technologies" : "Technologie";
  if (disciplines.includes("MARKETING_GROWTH")) return locale === "en" ? "Marketing and growth skills" : "Marketing i growth";
  if (disciplines.includes("DATA_AI")) return locale === "en" ? "Data / AI tools and skills" : "Data / AI - narzędzia i umiejętności";
  if (disciplines.includes("FOUNDER_BUSINESS")) return locale === "en" ? "Product and business skills" : "Kompetencje produktowe i biznesowe";
  return locale === "en" ? "Skills" : "Umiejętności";
}

function headlinePlaceholder(disciplines: ProfileDiscipline[], locale: "pl" | "en") {
  if (disciplines.includes("DESIGN")) return locale === "en" ? "e.g. Product designer focused on early-stage SaaS" : "np. Product designer projektujący produkty SaaS";
  if (disciplines.includes("DEVELOPMENT")) return locale === "en" ? "e.g. Full-stack developer building SaaS products" : "np. Full-stack developer budujący produkty SaaS";
  if (disciplines.includes("FOUNDER_BUSINESS")) return locale === "en" ? "e.g. Founder building tools for small businesses" : "np. Founder budujący narzędzia dla małych firm";
  if (disciplines.includes("MARKETING_GROWTH")) return locale === "en" ? "e.g. Growth marketer helping early products find users" : "np. Growth marketer pomagający młodym produktom zdobywać użytkowników";
  return locale === "en" ? "What do you build or help teams with?" : "Co budujesz albo w czym pomagasz zespołom?";
}

function workDescriptionPlaceholder(disciplines: ProfileDiscipline[], locale: "pl" | "en") {
  if (disciplines.includes("DESIGN")) return locale === "en" ? "What did you design and what were you responsible for?" : "Co zaprojektowałeś/aś i za co odpowiadałeś/aś?";
  if (disciplines.includes("MARKETING_GROWTH")) return locale === "en" ? "What was the goal, what did you do, and what changed?" : "Jaki był cel, co zrobiłeś/aś i jaki był efekt?";
  if (disciplines.includes("DEVELOPMENT") || disciplines.includes("DATA_AI")) return locale === "en" ? "What did you build and which part did you own?" : "Co zbudowałeś/aś i za którą część odpowiadałeś/aś?";
  return locale === "en" ? "What is this work and what was your contribution?" : "Co to za praca i jaki był Twój wkład?";
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-6"><div className="max-w-[690px]"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-1 text-sm leading-5 text-[var(--bc-muted)]">{subtitle}</p></div>{children}</div>;
}

function Field({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <div className="flex flex-col gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function DisciplineTile({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("relative min-h-[90px] rounded-[6px] border p-3.5 text-left transition-[background-color,border-color,box-shadow]", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] ring-1 ring-[var(--bc-accent-strong)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]")}>{active ? <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-neutral-950 text-[var(--bc-accent)]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span> : null}<span className="block pr-7 text-sm font-semibold">{title}</span><span className="mt-1 block text-[11px] leading-4 text-[var(--bc-muted)]">{description}</span></button>;
}

function SelectableTile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("relative min-h-11 rounded-[6px] border px-3 py-2.5 text-center text-sm font-medium transition-[background-color,border-color,box-shadow]", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950 ring-1 ring-[var(--bc-accent-strong)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]")}>{active ? <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-neutral-950 text-[var(--bc-accent)]"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span> : null}{label}</button>;
}

function TagToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("rounded-[6px] border px-2.5 py-1.5 text-[13px] font-medium transition-colors", active ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent)] text-neutral-950" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]")}>{label}</button>;
}

function CheckTile({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 transition-colors", checked ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)]" : "border-[var(--bc-line)] hover:border-[var(--bc-line-strong)]")}><Checkbox checked={checked} onCheckedChange={onChange} /><span className="text-sm font-medium">{label}</span></label>;
}
