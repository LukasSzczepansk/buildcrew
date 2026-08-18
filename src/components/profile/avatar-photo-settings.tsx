"use client";

import * as React from "react";
import { Camera, Check, Clock3, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { cancelPendingProfileAvatar, removeApprovedProfileAvatar, submitProfileAvatar } from "@/server/actions/profile-avatar";

type AvatarState = {
  approved: { id: string; uploadedAt: Date; moderatedAt: Date | null } | null;
  pending: { id: string; uploadedAt: Date; byteSize: number } | null;
  rejected: { id: string; uploadedAt: Date; moderatedAt: Date | null; rejectionReason: string | null } | null;
};

type CopyFn = (pl: string, en: string) => string;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 550 * 1024;

async function loadImage(file: File, copy: CopyFn) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(copy("Nie udało się odczytać pliku obrazu.", "The image file could not be read.")));
      image.src = url;
    });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number, copy: CopyFn) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(copy("Ta przeglądarka nie potrafi przygotować zdjęcia WebP.", "This browser could not create a WebP image."))), "image/webp", quality);
  });
}

function blobToDataUrl(blob: Blob, copy: CopyFn) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(copy("Nie udało się przygotować zdjęcia.", "The image could not be prepared.")));
    reader.readAsDataURL(blob);
  });
}

async function prepareAvatar(file: File, copy: CopyFn) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(copy("Wybierz plik JPG, PNG lub WebP.", "Choose a JPG, PNG or WebP file."));
  if (file.size > MAX_INPUT_BYTES) throw new Error(copy("Plik źródłowy może mieć maksymalnie 8 MB.", "The source file can be at most 8 MB."));
  const image = await loadImage(file, copy);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (Math.min(sourceWidth, sourceHeight) < 64) throw new Error(copy("Zdjęcie jest zbyt małe. Minimum to 64 × 64 px.", "The image is too small. Minimum size is 64 × 64 px."));
  const crop = Math.min(sourceWidth, sourceHeight);
  const target = Math.min(512, crop);
  const sx = Math.max(0, Math.floor((sourceWidth - crop) / 2));
  const sy = Math.max(0, Math.floor((sourceHeight - crop) / 2));
  const canvas = document.createElement("canvas"); canvas.width = target; canvas.height = target;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error(copy("Nie udało się przygotować podglądu zdjęcia.", "The image preview could not be prepared."));
  context.drawImage(image, sx, sy, crop, crop, 0, 0, target, target);
  let blob: Blob | null = null;
  for (const quality of [0.86, 0.76, 0.66, 0.56]) { const candidate = await canvasToWebp(canvas, quality, copy); blob = candidate; if (candidate.size <= MAX_OUTPUT_BYTES) break; }
  if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new Error(copy("Zdjęcie jest zbyt złożone. Wybierz inne zdjęcie lub mniejszy plik.", "The image is too complex to process. Choose another image or a smaller file."));
  return { blob, dataUrl: await blobToDataUrl(blob, copy) };
}

function formatDate(value: Date | string | null | undefined, locale: "pl" | "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function AvatarPhotoSettings({ username, initialState }: { username: string; initialState: AvatarState }) {
  const copy = useCopy();
  const locale = useLocale();
  const [state, setState] = React.useState(initialState);
  const [selectedDataUrl, setSelectedDataUrl] = React.useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = React.useState<string | null>(null);
  const [rights, setRights] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => () => { if (selectedPreview) URL.revokeObjectURL(selectedPreview); }, [selectedPreview]);

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const prepared = await prepareAvatar(file, copy);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
      setSelectedPreview(URL.createObjectURL(prepared.blob)); setSelectedDataUrl(prepared.dataUrl); setRights(false); setConsent(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : copy("Nie udało się przygotować zdjęcia.", "The image could not be prepared.")); }
  }

  function send() {
    if (!selectedDataUrl) return;
    if (!rights || !consent) { toast.error(copy("Potwierdź oba oświadczenia przed wysłaniem zdjęcia.", "Confirm both statements before submitting the image.")); return; }
    startTransition(async () => {
      const result = await submitProfileAvatar({ dataUrl: selectedDataUrl, confirmsRights: rights, consentsToDisplay: consent });
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(copy("Zdjęcie wysłane do sprawdzenia.", "Photo submitted for review."));
      setSelectedDataUrl(null); if (selectedPreview) URL.revokeObjectURL(selectedPreview); setSelectedPreview(null); setRights(false); setConsent(false);
      setState((current) => ({ ...current, pending: { id: `pending-${Date.now()}`, uploadedAt: new Date(), byteSize: 0 }, rejected: null }));
    });
  }

  function cancelPending() { startTransition(async () => { const result = await cancelPendingProfileAvatar(); if (result.error) { toast.error(appMessage(result.error, locale)); return; } toast.success(copy("Oczekujące zdjęcie usunięte.", "Pending photo removed.")); setState((current) => ({ ...current, pending: null })); }); }
  function removeApproved() { if (!window.confirm(copy("Usunąć zaakceptowane zdjęcie profilowe? Wrócą inicjały.", "Remove the approved profile photo? Your initials will be shown again."))) return; startTransition(async () => { const result = await removeApprovedProfileAvatar(); if (result.error) { toast.error(appMessage(result.error, locale)); return; } toast.success(copy("Zdjęcie profilowe usunięte.", "Profile photo removed.")); setState((current) => ({ ...current, approved: null })); }); }

  const currentPendingUrl = state.pending && !String(state.pending.id).startsWith("pending-") ? `/api/avatar/pending?v=${encodeURIComponent(String(new Date(state.pending.uploadedAt).getTime()))}` : null;

  return (
    <section className="border-t border-[var(--bc-line)] py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-[16px] font-semibold tracking-[-0.01em]">{copy("Zdjęcie profilowe", "Profile photo")}</h2><p className="mt-1 max-w-[720px] text-[12px] leading-4 text-[var(--bc-faint)]">{copy("Opcjonalne. Nowe zdjęcie jest widoczne dopiero po ręcznej moderacji. Jeśli go nie dodasz, BuildCrew nadal używa inicjałów.", "Optional. A new photo becomes visible only after manual review. If you do not add one, BuildCrew continues to show your initials.")}</p></div><span className="text-[11px] font-medium uppercase tracking-[0.09em] text-[var(--bc-faint)]">JPG / PNG / WebP · {copy("do 8 MB", "up to 8 MB")}</span></div>
      <div className="grid gap-5 border-y border-[var(--bc-line)] py-5 md:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex items-start justify-center md:justify-start">{selectedPreview ? <img src={selectedPreview} alt={copy("Podgląd nowego zdjęcia profilowego", "New profile photo preview")} className="h-24 w-24 rounded-full border border-[var(--bc-line-strong)] object-cover" /> : currentPendingUrl ? <img src={currentPendingUrl} alt={copy("Zdjęcie oczekujące na moderację", "Photo pending review")} className="h-24 w-24 rounded-full border border-[var(--bc-line-strong)] object-cover" /> : <Avatar username={username} size="xl" />}</div>
        <div className="min-w-0">
          {selectedDataUrl ? <div><div className="flex items-center gap-2 text-sm font-medium"><Camera className="h-4 w-4" /> {copy("Zdjęcie gotowe do wysłania", "Photo ready to submit")}</div><p className="mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("Przed wysłaniem zdjęcie zostało przycięte do kwadratu, zmniejszone maksymalnie do 512 px i ponownie zapisane jako WebP. Usuwa to metadane EXIF, w tym typowe dane lokalizacyjne z telefonu.", "Before upload, the image is cropped to a square, resized to at most 512 px and re-encoded as WebP. This removes EXIF metadata, including typical phone location data.")}</p><div className="mt-4 space-y-3"><label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#a8d72f]" checked={rights} onChange={(e) => setRights(e.target.checked)} /><span>{copy("Potwierdzam, że zdjęcie przedstawia mnie albo mam prawo użyć go jako mojego zdjęcia profilowego.", "I confirm that the photo shows me or that I have the right to use it as my profile photo.")}</span></label><label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#a8d72f]" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{copy("Wyrażam zgodę na wyświetlanie tego zdjęcia jako mojego avatara w BuildCrew po akceptacji przez moderację. Mogę ją wycofać, usuwając zdjęcie.", "I agree to display this image as my BuildCrew avatar after moderation approval. I can withdraw this consent by removing the photo.")}</span></label></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={send} disabled={pending || !rights || !consent}><Upload className="h-3.5 w-3.5" /> {pending ? copy("Wysyłanie…", "Submitting…") : copy("Wyślij do moderacji", "Submit for review")}</Button><Button type="button" size="sm" variant="outline" onClick={() => { setSelectedDataUrl(null); if (selectedPreview) URL.revokeObjectURL(selectedPreview); setSelectedPreview(null); }}>{copy("Anuluj", "Cancel")}</Button></div></div>
          : state.pending ? <div><div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4" /> {copy("Oczekuje na sprawdzenie", "Pending review")}</div><p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">{copy("Przesłano", "Submitted")} {formatDate(state.pending.uploadedAt, locale)}. {state.approved ? copy("Do czasu decyzji pozostaje widoczne Twoje poprzednie zaakceptowane zdjęcie.", "Your previously approved photo remains visible until a decision is made.") : copy("Do czasu decyzji inni użytkownicy widzą Twoje inicjały.", "Other users see your initials until a decision is made.")}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> {copy("Zastąp oczekujące", "Replace pending photo")}</Button><Button type="button" size="sm" variant="ghost" onClick={cancelPending} disabled={pending}><X className="h-3.5 w-3.5" /> {copy("Anuluj zgłoszenie", "Cancel submission")}</Button></div></div>
          : state.approved ? <div><div className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4" /> {copy("Zdjęcie zaakceptowane", "Photo approved")}</div><p className="mt-1.5 text-[13px] leading-5 text-[var(--bc-muted)]">{copy("Jest używane jako Twój avatar w BuildCrew. Możesz je zmienić lub usunąć w dowolnym momencie.", "It is used as your BuildCrew avatar. You can change or remove it at any time.")}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> {copy("Zmień zdjęcie", "Change photo")}</Button><Button type="button" size="sm" variant="ghost" onClick={removeApproved} disabled={pending}><Trash2 className="h-3.5 w-3.5" /> {copy("Usuń zdjęcie", "Remove photo")}</Button></div></div>
          : <div><div className="text-sm font-medium">{copy("Używasz inicjałów", "You are using initials")}</div><p className="mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{copy("Zdjęcie nie jest wymagane do korzystania z BuildCrew. Jeśli je dodasz, najpierw trafi do kolejki moderacji i nie zostanie opublikowane automatycznie.", "A photo is not required to use BuildCrew. If you add one, it first goes through moderation and is not published automatically.")}</p>{state.rejected?.rejectionReason ? <div className="mt-3 border-l-2 border-[var(--bc-line-strong)] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]"><span className="font-medium text-[var(--bc-ink)]">{copy("Poprzednie zdjęcie odrzucono:", "Previous photo was rejected:")}</span> {state.rejected.rejectionReason}</div> : null}<Button type="button" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={pending}><Upload className="h-3.5 w-3.5" /> {copy("Dodaj zdjęcie", "Add photo")}</Button></div>}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile} />
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-4 text-[var(--bc-faint)]">{copy("BuildCrew nie używa zdjęcia do rozpoznawania twarzy ani automatycznej identyfikacji biometrycznej. Odrzucony lub usunięty obraz jest kasowany z rekordu zdjęcia; pozostają wyłącznie minimalne dane o decyzji moderacyjnej potrzebne do rozliczalności i bezpieczeństwa.", "BuildCrew does not use your photo for facial recognition or automated biometric identification. Rejected or removed images are deleted from the photo record; only minimal moderation-decision data is retained for accountability and safety.")}</p>
    </section>
  );
}
