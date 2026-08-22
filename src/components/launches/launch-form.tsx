"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LAUNCH_CATEGORIES, LAUNCH_NEEDS, LAUNCH_STATUSES, launchCategoryLabel, launchNeedLabel, launchStatusLabel } from "@/lib/launches";
import type { AppLocale } from "@/lib/site-config";
import { createLaunch, updateLaunch } from "@/server/actions/launches";

const MAX_FILES = 5;
const MAX_SOURCE = 10 * 1024 * 1024;
const MAX_OUTPUT = 475 * 1024;
type LocalImage = { id: string; dataUrl: string; preview: string; name: string };
type ProjectOption = { id: string; name: string; tagline: string; description: string; technologies: string[]; demoUrl: string | null; repositoryUrl: string | null };
type Initial = { id: string; slug: string; projectId: string | null; title: string; tagline: string; description: string; liveUrl: string | null; githubUrl: string | null; category: string; status: string; technologies: string[]; needs: string[]; images: { id: string }[] };

function blobToDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(blob); }); }
function canvasToWebp(canvas: HTMLCanvasElement, quality: number) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Nie udało się przygotować obrazu.")), "image/webp", quality)); }
async function loadImage(file: File) { const url = URL.createObjectURL(file); try { const image = new Image(); image.decoding = "async"; image.src = url; await image.decode(); return image; } finally { URL.revokeObjectURL(url); } }
async function prepareImage(file: File) {
  if (!file.type.startsWith("image/") || file.size > MAX_SOURCE) throw new Error("Obraz jest nieprawidłowy albo ma więcej niż 10 MB.");
  const image = await loadImage(file);
  const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(120, Math.round(image.naturalWidth * scale));
  const height = Math.max(120, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Nie udało się przygotować obrazu.");
  ctx.drawImage(image, 0, 0, width, height);
  let quality = 0.82; let blob = await canvasToWebp(canvas, quality);
  while (blob.size > MAX_OUTPUT && quality > 0.42) { quality -= 0.08; blob = await canvasToWebp(canvas, quality); }
  if (blob.size > MAX_OUTPUT) throw new Error("Nie udało się wystarczająco skompresować obrazu.");
  return { dataUrl: await blobToDataUrl(blob), preview: URL.createObjectURL(blob) };
}

export function LaunchForm({ locale, projects, initial }: { locale: AppLocale; projects: ProjectOption[]; initial?: Initial }) {
  const en = locale === "en";
  const c = <T,>(pl: T, english: T): T => en ? english : pl;
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [projectId, setProjectId] = React.useState(initial?.projectId ?? "");
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [tagline, setTagline] = React.useState(initial?.tagline ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [websiteUrl, setWebsiteUrl] = React.useState(initial?.liveUrl ?? "");
  const [githubUrl, setGithubUrl] = React.useState(initial?.githubUrl ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? "OTHER");
  const [status, setStatus] = React.useState(initial?.status ?? "MVP");
  const [technologies, setTechnologies] = React.useState((initial?.technologies ?? []).join(", "));
  const [needs, setNeeds] = React.useState<string[]>(initial?.needs ?? ["FEEDBACK"]);
  const [images, setImages] = React.useState<LocalImage[]>([]);

  function chooseProject(value: string) {
    setProjectId(value);
    const project = projects.find((item) => item.id === value);
    if (!project) return;
    setTitle(project.name); setTagline(project.tagline); setDescription(project.description); setTechnologies(project.technologies.join(", ")); setWebsiteUrl(project.demoUrl ?? ""); setGithubUrl(project.repositoryUrl ?? "");
  }

  async function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, MAX_FILES - images.length)); event.target.value = "";
    try {
      const prepared: LocalImage[] = [];
      for (const file of files) { const result = await prepareImage(file); prepared.push({ id: crypto.randomUUID(), dataUrl: result.dataUrl, preview: result.preview, name: file.name }); }
      setImages((current) => [...current, ...prepared]);
    } catch (error) { toast.error(error instanceof Error ? error.message : c("Nie udało się dodać obrazu.", "Could not add the image.")); }
  }
  function removeImage(id: string) { setImages((current) => { const found = current.find((item) => item.id === id); if (found) URL.revokeObjectURL(found.preview); return current.filter((item) => item.id !== id); }); }
  function toggleNeed(value: string) { setNeeds((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }

  function submit() {
    const input = { projectId, title, tagline, description, websiteUrl, githubUrl, category, status, technologies: technologies.split(",").map((item) => item.trim()).filter(Boolean), needs, images: images.map((image) => ({ dataUrl: image.dataUrl })), replaceImages: Boolean(initial && images.length) };
    startTransition(async () => {
      const result = initial ? await updateLaunch(initial.id, input) : await createLaunch(input);
      if (result.error) { toast.error(result.error); return; }
      toast.success(initial ? c("Premiera została zaktualizowana.", "Launch updated.") : c("Projekt został opublikowany.", "Project published."));
      router.push(`/launches/${result.slug}`); router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[820px]">
      {projects.length ? <section className="mb-7 border-b border-[var(--bc-line)] pb-6"><p className="text-[12px] font-semibold text-[var(--bc-ink)]">{c("Masz już projekt na BuildCrew?", "Already have a BuildCrew project?")}</p><p className="mt-1 text-[12px] text-[var(--bc-faint)]">{c("Wybierz go, a uzupełnimy podstawowe dane. Wszystko możesz później zmienić przed publikacją.", "Choose it to prefill the basic details. You can edit everything before publishing.")}</p><select className="mt-3 h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]" value={projectId} onChange={(event) => chooseProject(event.target.value)}><option value="">{c("Projekt zewnętrzny / bez powiązania", "External project / no link")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></section> : null}

      <div className="space-y-7">
        <FormSection title={c("Podstawy", "Basics")} description={c("Krótko i konkretnie - użytkownik ma zrozumieć projekt w kilka sekund.", "Keep it concise - people should understand the project in a few seconds.")}>
          <label className="text-[12px] font-medium">{c("Nazwa projektu", "Project name")}<Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></label>
          <label className="text-[12px] font-medium">{c("Krótki opis", "Short description")}<Input className="mt-1.5" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} placeholder={c("Jedno zdanie: co to jest i dla kogo?", "One sentence: what is it and who is it for?")} /><span className="mt-1 block text-right text-[10px] text-[var(--bc-faint)]">{tagline.length}/160</span></label>
          <label className="text-[12px] font-medium">{c("O projekcie", "About the project")}<Textarea className="mt-1.5 min-h-36" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3500} placeholder={c("Co stworzyłeś, jaki problem rozwiązujesz i na jakim etapie jest projekt?", "What did you build, what problem does it solve and what stage is it at?")} /></label>
        </FormSection>

        <FormSection title={c("Linki i etap", "Links and stage")} description={c("Publiczny link jest opcjonalny - możesz szukać testerów przed premierą produktu.", "A public URL is optional - you can look for testers before your product is public.")}>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-[12px] font-medium">{c("Link do projektu", "Project URL")}<Input className="mt-1.5" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" /></label><label className="text-[12px] font-medium">GitHub <span className="font-normal text-[var(--bc-faint)]">({c("opcjonalnie", "optional")})</span><Input className="mt-1.5" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-[12px] font-medium">{c("Kategoria", "Category")}<select className="mt-1.5 h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>{LAUNCH_CATEGORIES.map((item) => <option key={item} value={item}>{launchCategoryLabel(item, locale)}</option>)}</select></label><label className="text-[12px] font-medium">{c("Etap", "Stage")}<select className="mt-1.5 h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>{LAUNCH_STATUSES.map((item) => <option key={item} value={item}>{launchStatusLabel(item, locale)}</option>)}</select></label></div>
          <label className="text-[12px] font-medium">{c("Technologie", "Technologies")}<Input className="mt-1.5" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, Next.js, PostgreSQL" /><span className="mt-1 block text-[10px] text-[var(--bc-faint)]">{c("Oddziel przecinkami. Maksymalnie 12.", "Separate with commas. Up to 12.")}</span></label>
        </FormSection>

        <FormSection title={c("Czego teraz potrzebujesz?", "What do you need right now?")} description={c("To pomaga zamienić samo pokazanie projektu w konkretną rozmowę albo współpracę.", "This turns showing your project into useful conversations and collaboration.")}>
          <div className="grid gap-2 sm:grid-cols-2">{LAUNCH_NEEDS.map((need) => <label key={need} className={`flex cursor-pointer items-center gap-3 rounded-[8px] border px-3.5 py-3 text-[12px] transition-colors ${needs.includes(need) ? "border-[var(--bc-line-strong)] bg-[color-mix(in_srgb,var(--bc-accent)_9%,var(--bc-surface))]" : "border-[var(--bc-line)] bg-[var(--bc-surface)]"}`}><input type="checkbox" checked={needs.includes(need)} onChange={() => toggleNeed(need)} className="h-4 w-4 accent-[var(--bc-accent-strong)]" /><span>{launchNeedLabel(need, locale)}</span></label>)}</div>
        </FormSection>

        <FormSection title={c("Okładka i screenshoty", "Cover and screenshots")} description={c("Do 5 obrazów. Pierwszy będzie używany jako miniatura na liście Premier.", "Up to 5 images. The first one becomes the cover in the Launches list.")}>
          {initial?.images.length && !images.length ? <div className="mb-3"><p className="mb-2 text-[11px] text-[var(--bc-faint)]">{c("Obecne screenshoty. Dodanie nowych zastąpi cały zestaw.", "Current screenshots. Adding new images will replace the whole set.")}</p><div className="flex gap-2 overflow-x-auto">{initial.images.map((image) => <img key={image.id} src={`/api/launches/images/${image.id}`} alt="" className="h-20 w-32 shrink-0 rounded-[7px] border border-[var(--bc-line)] object-cover object-top" />)}</div></div> : null}
          <div className="flex flex-wrap gap-3">{images.map((image, index) => <div key={image.id} className="relative overflow-hidden rounded-[8px] border border-[var(--bc-line)]"><img src={image.preview} alt="" className="h-28 w-44 object-cover object-top" /><button type="button" onClick={() => removeImage(image.id)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-[6px] bg-[var(--bc-surface)]/95 text-[var(--bc-danger)] shadow-sm"><X className="h-3.5 w-3.5" /></button>{index === 0 ? <span className="absolute bottom-1.5 left-1.5 rounded-[5px] bg-neutral-950/85 px-1.5 py-0.5 text-[9px] font-semibold text-white">{c("OKŁADKA", "COVER")}</span> : null}</div>)}{images.length < MAX_FILES ? <button type="button" onClick={() => inputRef.current?.click()} className="grid h-28 w-44 place-items-center rounded-[8px] border border-dashed border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] text-center text-[11px] text-[var(--bc-muted)]"><span><ImagePlus className="mx-auto mb-1.5 h-5 w-5" />{c("Dodaj screenshot", "Add screenshot")}</span></button> : null}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addFiles} />
        </FormSection>
      </div>

      <div className="mt-8 flex items-center justify-end gap-2 border-t border-[var(--bc-line)] pt-5"><Button type="button" variant="ghost" onClick={() => router.back()}>{c("Anuluj", "Cancel")}</Button><Button type="button" disabled={pending || title.trim().length < 2 || tagline.trim().length < 4 || description.trim().length < 20} onClick={submit}>{pending ? c("Publikowanie…", "Publishing…") : initial ? c("Zapisz zmiany", "Save changes") : c("Opublikuj", "Publish")}</Button></div>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="grid gap-4 border-b border-[var(--bc-line)] pb-7 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-7"><div><h2 className="text-[13px] font-semibold text-[var(--bc-ink)]">{title}</h2><p className="mt-1 text-[11px] leading-5 text-[var(--bc-faint)]">{description}</p></div><div className="space-y-4">{children}</div></section>; }
