"use client";

import * as React from "react";
import { Camera, Check, Clock3, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  cancelPendingProfileAvatar,
  removeApprovedProfileAvatar,
  submitProfileAvatar,
} from "@/server/actions/profile-avatar";

type AvatarState = {
  approved: { id: string; uploadedAt: Date; moderatedAt: Date | null } | null;
  pending: { id: string; uploadedAt: Date; byteSize: number } | null;
  rejected: { id: string; uploadedAt: Date; moderatedAt: Date | null; rejectionReason: string | null } | null;
};

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 550 * 1024;

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Nie udało się odczytać pliku obrazu."));
      image.src = url;
    });
    return image;
  } finally {
    // Keep the decoded image in memory; the object URL is no longer needed after onload.
    URL.revokeObjectURL(url);
  }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Ta przeglądarka nie potrafi przygotować zdjęcia WebP.")), "image/webp", quality);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się przygotować zdjęcia."));
    reader.readAsDataURL(blob);
  });
}

async function prepareAvatar(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Wybierz plik JPG, PNG lub WebP.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Plik źródłowy może mieć maksymalnie 8 MB.");

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (Math.min(sourceWidth, sourceHeight) < 64) throw new Error("Zdjęcie jest zbyt małe. Minimum to 64 × 64 px.");

  const crop = Math.min(sourceWidth, sourceHeight);
  const target = Math.min(512, crop);
  const sx = Math.max(0, Math.floor((sourceWidth - crop) / 2));
  const sy = Math.max(0, Math.floor((sourceHeight - crop) / 2));

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Nie udało się przygotować podglądu zdjęcia.");
  context.drawImage(image, sx, sy, crop, crop, 0, 0, target, target);

  let blob: Blob | null = null;
  for (const quality of [0.86, 0.76, 0.66, 0.56]) {
    const candidate = await canvasToWebp(canvas, quality);
    blob = candidate;
    if (candidate.size <= MAX_OUTPUT_BYTES) break;
  }
  if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new Error("Zdjęcie jest zbyt złożone. Wybierz inne zdjęcie lub mniejszy plik.");

  return { blob, dataUrl: await blobToDataUrl(blob) };
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function AvatarPhotoSettings({ username, initialState }: { username: string; initialState: AvatarState }) {
  const [state, setState] = React.useState(initialState);
  const [selectedDataUrl, setSelectedDataUrl] = React.useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = React.useState<string | null>(null);
  const [rights, setRights] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
  }, [selectedPreview]);

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const prepared = await prepareAvatar(file);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
      setSelectedPreview(URL.createObjectURL(prepared.blob));
      setSelectedDataUrl(prepared.dataUrl);
      setRights(false);
      setConsent(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się przygotować zdjęcia.");
    }
  }

  function send() {
    if (!selectedDataUrl) return;
    if (!rights || !consent) {
      toast.error("Potwierdź oba oświadczenia przed wysłaniem zdjęcia.");
      return;
    }
    startTransition(async () => {
      const result = await submitProfileAvatar({ dataUrl: selectedDataUrl, confirmsRights: rights, consentsToDisplay: consent });
      if (result.error) { toast.error(result.error); return; }
      toast.success("Zdjęcie wysłane do sprawdzenia.");
      setSelectedDataUrl(null);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
      setSelectedPreview(null);
      setRights(false);
      setConsent(false);
      setState((current) => ({
        ...current,
        pending: { id: `pending-${Date.now()}`, uploadedAt: new Date(), byteSize: 0 },
        rejected: null,
      }));
    });
  }

  function cancelPending() {
    startTransition(async () => {
      const result = await cancelPendingProfileAvatar();
      if (result.error) { toast.error(result.error); return; }
      toast.success("Oczekujące zdjęcie usunięte.");
      setState((current) => ({ ...current, pending: null }));
    });
  }

  function removeApproved() {
    if (!window.confirm("Usunąć zaakceptowane zdjęcie profilowe? Wrócą inicjały.")) return;
    startTransition(async () => {
      const result = await removeApprovedProfileAvatar();
      if (result.error) { toast.error(result.error); return; }
      toast.success("Zdjęcie profilowe usunięte.");
      setState((current) => ({ ...current, approved: null }));
    });
  }

  const currentPendingUrl = state.pending && !String(state.pending.id).startsWith("pending-")
    ? `/api/avatar/pending?v=${encodeURIComponent(String(new Date(state.pending.uploadedAt).getTime()))}`
    : null;

  return (
    <section className="border-t border-[var(--bc-line)] py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Zdjęcie profilowe</h2>
          <p className="mt-1 max-w-[720px] text-[12px] leading-4 text-[var(--bc-faint)]">
            Opcjonalne. Nowe zdjęcie jest widoczne dopiero po ręcznej moderacji. Jeśli go nie dodasz, BuildCrew nadal używa inicjałów.
          </p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-[var(--bc-faint)]">JPG / PNG / WebP · do 8 MB</span>
      </div>

      <div className="grid gap-5 border-y border-[var(--bc-line)] py-5 md:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex items-start justify-center md:justify-start">
          {selectedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedPreview} alt="Podgląd nowego zdjęcia profilowego" className="h-24 w-24 rounded-full border border-[var(--bc-line-strong)] object-cover" />
          ) : currentPendingUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentPendingUrl} alt="Zdjęcie oczekujące na moderację" className="h-24 w-24 rounded-full border border-[var(--bc-line-strong)] object-cover" />
          ) : (
            <Avatar username={username} size="xl" />
          )}
        </div>

        <div className="min-w-0">
          {selectedDataUrl ? (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><Camera className="h-4 w-4" /> Zdjęcie gotowe do wysłania</div>
              <p className="mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">Przed wysłaniem zdjęcie zostało przycięte do kwadratu, zmniejszone maksymalnie do 512 px i ponownie zapisane jako WebP. Usuwa to metadane EXIF, w tym typowe dane lokalizacyjne z telefonu.</p>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#a8d72f]" checked={rights} onChange={(e) => setRights(e.target.checked)} /><span>Potwierdzam, że zdjęcie przedstawia mnie albo mam prawo użyć go jako mojego zdjęcia profilowego.</span></label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#a8d72f]" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Wyrażam zgodę na wyświetlanie tego zdjęcia jako mojego avatara w BuildCrew po akceptacji przez moderację. Mogę ją wycofać, usuwając zdjęcie.</span></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={send} disabled={pending || !rights || !consent}><Upload className="h-3.5 w-3.5" /> {pending ? "Wysyłanie…" : "Wyślij do moderacji"}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setSelectedDataUrl(null); if (selectedPreview) URL.revokeObjectURL(selectedPreview); setSelectedPreview(null); }}>Anuluj</Button>
              </div>
            </div>
          ) : state.pending ? (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4" /> Oczekuje na sprawdzenie</div>
              <p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">
                Przesłano {formatDate(state.pending.uploadedAt)}. {state.approved ? "Do czasu decyzji pozostaje widoczne Twoje poprzednie zaakceptowane zdjęcie." : "Do czasu decyzji inni użytkownicy widzą Twoje inicjały."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> Zastąp oczekujące</Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelPending} disabled={pending}><X className="h-3.5 w-3.5" /> Anuluj zgłoszenie</Button>
              </div>
            </div>
          ) : state.approved ? (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4" /> Zdjęcie zaakceptowane</div>
              <p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">Jest używane jako Twój avatar w BuildCrew. Możesz je zmienić lub usunąć w dowolnym momencie.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> Zmień zdjęcie</Button>
                <Button type="button" size="sm" variant="ghost" onClick={removeApproved} disabled={pending}><Trash2 className="h-3.5 w-3.5" /> Usuń zdjęcie</Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium">Używasz inicjałów</div>
              <p className="mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">Zdjęcie nie jest wymagane do korzystania z BuildCrew. Jeśli je dodasz, najpierw trafi do kolejki moderacji i nie zostanie opublikowane automatycznie.</p>
              {state.rejected?.rejectionReason ? <div className="mt-3 border-l-2 border-[var(--bc-line-strong)] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]"><span className="font-medium text-[var(--bc-ink)]">Poprzednie zdjęcie odrzucono:</span> {state.rejected.rejectionReason}</div> : null}
              <Button type="button" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> Dodaj zdjęcie</Button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile} />
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-4 text-[var(--bc-faint)]">
        BuildCrew nie używa zdjęcia do rozpoznawania twarzy ani automatycznej identyfikacji biometrycznej. Odrzucony lub usunięty obraz jest kasowany z rekordu zdjęcia; pozostają wyłącznie minimalne dane o decyzji moderacyjnej potrzebne do rozliczalności i bezpieczeństwa.
      </p>
    </section>
  );
}
