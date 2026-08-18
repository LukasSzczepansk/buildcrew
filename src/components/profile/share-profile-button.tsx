"use client";

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

export function ShareProfileButton({ userId, username }: { userId: string; username: string }) {
  const copy = useCopy();
  async function share() {
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${username} - BuildCrew`, url }); return; } catch (error) { if ((error as DOMException)?.name === "AbortError") return; }
    }
    await navigator.clipboard.writeText(url);
  }
  return (
    <div className="flex gap-1">
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={share}><Share2 className="h-3.5 w-3.5" />{copy("Udostępnij profil", "Share profile")}</Button>
      <a href={`/api/profiles/${userId}/share-card`} download={`${username}-buildcrew.png`} title={copy("Pobierz grafikę profilu", "Download profile graphic")} className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--bc-line)] text-[var(--bc-muted)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"><Download className="h-3.5 w-3.5" /></a>
    </div>
  );
}
