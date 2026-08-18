"use client";

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

export function SharePostButton({ postId, title }: { postId: string; title: string }) {
  const copy = useCopy();
  async function share() {
    const url = `${window.location.origin}/s/${postId}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (error) { if ((error as DOMException)?.name === "AbortError") return; }
    }
    await navigator.clipboard.writeText(url);
  }
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[11px]" onClick={share}><Share2 className="h-3.5 w-3.5" />{copy("Udostępnij", "Share")}</Button>
      <a href={`/api/posts/${postId}/share-card`} download={`${postId}-buildcrew.png`} className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]" title={copy("Pobierz grafikę", "Download graphic")}><Download className="h-3.5 w-3.5" /></a>
    </div>
  );
}
