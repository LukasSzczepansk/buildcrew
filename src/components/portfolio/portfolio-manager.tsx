"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCopy } from "@/components/i18n/locale-provider";
import { createPortfolioItem, deletePortfolioItem } from "@/server/actions/portfolio";
import type { PortfolioViewItem } from "@/server/data/portfolio";

const MAX_FILES = 6;
const MAX_SOURCE = 10 * 1024 * 1024;
const MAX_OUTPUT = 475 * 1024;
type LocalImage = { id: string; dataUrl: string; preview: string; name: string };
type CopyFn = (pl: string, en: string) => string;

function blobToDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result ?? "")); r.onerror = reject; r.readAsDataURL(blob); }); }
function canvasToWebp(canvas: HTMLCanvasElement, quality: number, copy: CopyFn) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(copy("Nie udało się przygotować obrazu.", "Could not prepare the image."))), "image/webp", quality)); }

async function prepareImage(file: File, copy: CopyFn) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(copy("Dodaj plik JPG, PNG lub WebP.", "Add a JPG, PNG or WebP file."));
  if (file.size > MAX_SOURCE) throw new Error(copy("Jeden plik może mieć maksymalnie 10 MB.", "A source file can be at most 10 MB."));
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.decoding = "async";
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(copy("Nie udało się odczytać obrazu.", "Could not read the image."))); image.src = url; });
    const sourceW = image.naturalWidth || image.width, sourceH = image.naturalHeight || image.height;
    if (Math.min(sourceW, sourceH) < 120) throw new Error(copy("Obraz jest zbyt mały.", "The image is too small."));
    const scale = Math.min(1, 1800 / Math.max(sourceW, sourceH));
    const width = Math.max(1, Math.round(sourceW * scale)), height = Math.max(1, Math.round(sourceH * scale));
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false }); if (!ctx) throw new Error(copy("Nie udało się przygotować obrazu.", "Could not prepare the image."));
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(image, 0, 0, width, height);
    let blob: Blob | null = null;
    for (const quality of [0.88, 0.78, 0.68, 0.58, 0.48]) { blob = await canvasToWebp(canvas, quality, copy); if (blob.size <= MAX_OUTPUT) break; }
    if (!blob || blob.size > MAX_OUTPUT) throw new Error(copy("Ten screen jest zbyt złożony. Spróbuj mniejszego obrazu.", "This screen is too complex. Try a smaller image."));
    return { dataUrl: await blobToDataUrl(blob), preview: URL.createObjectURL(blob) };
  } finally { URL.revokeObjectURL(url); }
}

export function PortfolioManager({ items, projects }: { items: PortfolioViewItem[]; projects: { id: string; name: string }[] }) {
  const copy = useCopy();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [role, setRole] = React.useState("");
  const [tools, setTools] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [images, setImages] = React.useState<LocalImage[]>([]);
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const imagesRef = React.useRef(images);
  React.useEffect(() => { imagesRef.current = images; }, [images]);
  React.useEffect(() => () => { imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)); }, []);

  async function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (!files.length) return;
    if (images.length + files.length > MAX_FILES) { toast.error(copy(`Możesz dodać maksymalnie ${MAX_FILES} screenów.`, `You can add up to ${MAX_FILES} screens.`)); return; }
    try {
      const prepared: LocalImage[] = [];
      for (const file of files) { const image = await prepareImage(file, copy); prepared.push({ id: crypto.randomUUID(), ...image, name: file.name }); }
      setImages((current) => [...current, ...prepared]);
    } catch (error) { toast.error(error instanceof Error ? error.message : copy("Nie udało się dodać obrazu.", "Could not add the image.")); }
  }

  function move(index: number, direction: -1 | 1) { setImages((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  function removeLocal(id: string) { setImages((current) => { const image = current.find((item) => item.id === id); if (image) URL.revokeObjectURL(image.preview); return current.filter((item) => item.id !== id); }); }
  function reset() { images.forEach((image) => URL.revokeObjectURL(image.preview)); setImages([]); setTitle(""); setDescription(""); setRole(""); setTools(""); setProjectId(""); setOpen(false); }

  function submit() {
    if (title.trim().length < 2) { toast.error(copy("Dodaj nazwę pracy.", "Add a title for the work.")); return; }
    if (!images.length) { toast.error(copy("Dodaj przynajmniej jeden screen.", "Add at least one screen.")); return; }
    startTransition(async () => {
      const result = await createPortfolioItem({ title, description, role, tools: tools.split(",").map((item) => item.trim()).filter(Boolean), projectId: projectId || null, images: images.map((image) => ({ dataUrl: image.dataUrl })) });
      if (result.error) { toast.error(copy("Nie udało się zapisać portfolio. Sprawdź dane i spróbuj ponownie.", "Could not save the portfolio item. Check the details and try again.")); return; }
      toast.success(copy("Praca została dodana do portfolio.", "Work added to your portfolio.")); reset(); router.refresh();
    });
  }

  function removeItem(itemId: string) {
    if (!window.confirm(copy("Usunąć tę pracę z portfolio?", "Remove this work from your portfolio?"))) return;
    startTransition(async () => { const result = await deletePortfolioItem(itemId); if (result.error) { toast.error(copy("Nie udało się usunąć pracy.", "Could not remove the work.")); return; } toast.success(copy("Praca została usunięta.", "Portfolio work removed.")); router.refresh(); });
  }

  return (
    <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-[17px] font-semibold tracking-[-0.015em]">Portfolio</h2><p className="mt-1 max-w-[760px] text-[12px] leading-5 text-[var(--bc-muted)]">{copy("Dodawaj screeny swojej pracy bezpośrednio do BuildCrew. UI, branding, frontend, gry, 3D i inne rzeczy najlepiej pokazywać wizualnie.", "Add screenshots of your work directly to BuildCrew. UI, branding, frontend, games, 3D and other visual work belong here.")}</p></div>
        <Button type="button" size="sm" onClick={() => setOpen((value) => !value)} className="gap-1.5"><Plus className="h-4 w-4" /> {open ? copy("Zamknij formularz", "Close form") : copy("Dodaj pracę", "Add work")}</Button>
      </div>

      {open ? <div className="mt-5 rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[12px] font-medium">{copy("Nazwa pracy", "Work title")}<Input className="mt-1.5 bg-[var(--bc-surface)]" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy("np. Redesign aplikacji bankowej", "e.g. Banking app redesign")} maxLength={90} /></label>
          <label className="text-[12px] font-medium">{copy("Twoja rola", "Your role")}<Input className="mt-1.5 bg-[var(--bc-surface)]" value={role} onChange={(e) => setRole(e.target.value)} placeholder={copy("np. UX/UI Designer", "e.g. UX/UI Designer")} maxLength={80} /></label>
          <label className="text-[12px] font-medium md:col-span-2">{copy("Krótki opis", "Short description")}<Textarea className="mt-1.5 min-h-24 bg-[var(--bc-surface)]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={copy("Co zaprojektowałeś lub zbudowałeś i za co odpowiadałeś?", "What did you design or build, and what were you responsible for?")} maxLength={1600} /></label>
          <label className="text-[12px] font-medium">{copy("Narzędzia / technologie", "Tools / technologies")}<Input className="mt-1.5 bg-[var(--bc-surface)]" value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Figma, FigJam, React" /></label>
          <label className="text-[12px] font-medium">{copy("Powiąż z projektem BuildCrew (opcjonalnie)", "Link to a BuildCrew project (optional)")}<select className="mt-1.5 h-10 w-full rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">{copy("Bez powiązania", "No linked project")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[12px] font-medium">{copy("Screeny", "Screens")}</p><p className="mt-0.5 text-[11px] text-[var(--bc-faint)]">{copy("Do 6 obrazów. Pierwszy jest okładką. Strzałkami ustaw kolejność.", "Up to 6 images. The first one is the cover. Use the arrows to reorder them.")}</p></div><Button type="button" variant="outline" size="sm" className="gap-1.5 bg-[var(--bc-surface)]" onClick={() => inputRef.current?.click()}><ImagePlus className="h-4 w-4" /> {copy("Dodaj screeny", "Add screens")}</Button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addFiles} /></div>
          {images.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <div key={image.id} className="relative overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)]"><img src={image.preview} alt="" className="aspect-[16/10] w-full object-cover object-top" /><div className="flex items-center justify-between gap-2 border-t border-[var(--bc-line)] px-2 py-2"><span className="min-w-0 truncate text-[10px] text-[var(--bc-faint)]">{index === 0 ? copy("OKŁADKA", "COVER") : `${index + 1}.`} · {image.name}</span><div className="flex shrink-0 gap-0.5"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-[var(--bc-muted)] disabled:opacity-20" aria-label={copy("Przesuń wcześniej", "Move earlier")}><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} className="p-1 text-[var(--bc-muted)] disabled:opacity-20" aria-label={copy("Przesuń później", "Move later")}><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => removeLocal(image.id)} className="p-1 text-[var(--bc-danger)]" aria-label={copy("Usuń", "Remove")}><X className="h-3.5 w-3.5" /></button></div></div></div>)}</div> : <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 flex min-h-36 w-full items-center justify-center rounded-[9px] border border-dashed border-[var(--bc-line-strong)] bg-[var(--bc-surface)] px-5 text-center text-[12px] text-[var(--bc-muted)] hover:border-[var(--bc-ink)]"><span><ImagePlus className="mx-auto mb-2 h-5 w-5" />{copy("Kliknij i dodaj screeny swojej pracy", "Click to add screenshots of your work")}</span></button>}
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={reset}>{copy("Anuluj", "Cancel")}</Button><Button type="button" onClick={submit} disabled={pending || !images.length}>{pending ? copy("Publikowanie…", "Publishing…") : copy("Opublikuj w portfolio", "Publish to portfolio")}</Button></div>
      </div> : null}

      {items.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)]"><div className="relative">{item.images[0] ? <img src={`/api/portfolio/images/${item.images[0].id}`} alt={item.title} className="aspect-[16/10] w-full object-cover object-top" /> : <div className="aspect-[16/10] w-full bg-[var(--bc-surface-subtle)]" />}<Button type="button" variant="secondary" size="icon" onClick={() => removeItem(item.id)} disabled={pending} className="absolute right-2 top-2 h-8 w-8 bg-[var(--bc-surface)]/95 text-[var(--bc-danger)] shadow-sm" aria-label={copy("Usuń", "Remove")}><Trash2 className="h-3.5 w-3.5" /></Button></div><div className="p-3.5"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-[11px] text-[var(--bc-faint)]">{item.role || copy("Praca w portfolio", "Portfolio work")} · {item.images.length} {copy("screenów", "screens")}</p>{item.tools.length ? <div className="mt-2 flex flex-wrap gap-1">{item.tools.slice(0, 4).map((tool) => <span key={tool} className="rounded-[5px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2 py-0.5 text-[10px] text-[var(--bc-muted)]">{tool}</span>)}</div> : null}</div></article>)}</div> : <div className="mt-5 rounded-[10px] border border-dashed border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] px-5 py-8 text-center"><ImagePlus className="mx-auto h-5 w-5 text-[var(--bc-faint)]" /><p className="mt-2 text-[13px] font-medium">{copy("Nie masz jeszcze prac w portfolio", "No portfolio work yet")}</p><p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-[var(--bc-faint)]">{copy("Dodaj pierwszą pracę, żeby inni mogli ocenić ją bez wychodzenia z BuildCrew.", "Add your first piece so people can assess it without leaving BuildCrew.")}</p></div>}
    </section>
  );
}
