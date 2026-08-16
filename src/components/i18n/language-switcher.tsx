"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { pathForLocale, SITE_URL_EN, SITE_URL_PL, type AppLocale } from "@/lib/site-config";
import { useLocale } from "@/components/i18n/locale-provider";

function targetUrl(locale: AppLocale, pathname: string, query: string) {
  const base = locale === "en" ? SITE_URL_EN : SITE_URL_PL;
  const mapped = pathForLocale(pathname || "/", locale);
  return `${base}${mapped}${query ? `?${query}` : ""}`;
}

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    try {
      document.cookie = `buildcrew-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // The production domains still determine the locale when cookies are unavailable.
    }
    const query = window.location.search.replace(/^\?/, "");
    window.location.assign(targetUrl(nextLocale, pathname, query));
  }

  return (
    <div className={cn("inline-flex items-center rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-0.5 text-[11px] font-semibold", className)} aria-label={locale === "en" ? "Language" : "Język"}>
      {(["pl", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => switchLocale(item)}
          className={cn(
            "rounded-[4px] px-2 py-1 transition-colors",
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
