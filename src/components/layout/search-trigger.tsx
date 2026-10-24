"use client";

import { Search } from "lucide-react";
import { useCopy } from "@/components/i18n/locale-provider";

/** Visible entry point to the Ctrl+K command palette, so the shortcut can actually be discovered. */
export function SearchTrigger() {
  const copy = useCopy();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("bc:command-palette"))}
      className="hidden h-10 w-[220px] items-center gap-2 rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-left text-[13px] text-[var(--bc-faint)] shadow-[var(--bc-shadow-xs)] transition-colors hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-muted)] lg:flex"
      aria-label={copy("Szukaj i przechodź (Ctrl K)", "Search and jump (Ctrl K)")}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{copy("Szukaj…", "Search…")}</span>
      <kbd className="rounded border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-1.5 py-0.5 text-[11px] font-medium">Ctrl K</kbd>
    </button>
  );
}
