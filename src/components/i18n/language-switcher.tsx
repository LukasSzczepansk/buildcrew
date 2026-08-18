"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/site-config";
import { useLocale } from "@/components/i18n/locale-provider";

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    document.cookie = `buildcrew-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
    } catch {
      // The cookie is enough for guests and as a fallback.
    }
    router.replace(pathname + window.location.search);
    router.refresh();
  }

  return (
    <div className={cn("inline-flex items-center rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-0.5 text-[11px] font-semibold", className)} aria-label={locale === "en" ? "Language" : "Język"}>
      {(["pl", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => switchLocale(item)}
          className={cn(
            "rounded-[5px] px-2 py-1 transition-colors",
            locale === item ? "bg-[var(--bc-ink)] text-[var(--bc-surface)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]",
            compact && "px-1.5 py-0.5",
          )}
          aria-pressed={locale === item}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
