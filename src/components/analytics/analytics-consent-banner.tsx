"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

const STORAGE_KEY = "buildcrew-analytics-consent";
type ConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(choice: ConsentChoice) {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function AnalyticsConsentBanner() {
  const [visible, setVisible] = React.useState(false);
  const copy = useCopy();

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ConsentChoice | null;
      if (saved === "granted" || saved === "denied") {
        updateGoogleConsent(saved);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }

    const reopen = () => setVisible(true);
    window.addEventListener("buildcrew:open-cookie-settings", reopen);
    return () => window.removeEventListener("buildcrew:open-cookie-settings", reopen);
  }, []);

  function choose(choice: ConsentChoice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Sama zgoda działa również bez możliwości zapisu w localStorage.
    }
    updateGoogleConsent(choice);
    window.dispatchEvent(new CustomEvent("buildcrew:analytics-consent-change", { detail: { choice } }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-[760px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)] p-4 shadow-[0_10px_34px_rgba(0,0,0,0.12)] sm:bottom-5 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[470px]">
          <p className="text-sm font-semibold text-[var(--bc-ink)]">{copy("Opcjonalna analityka", "Optional analytics")}</p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">
            {copy("Google Analytics pomaga nam sprawdzić, które funkcje BuildCrew są używane. Reklamowej personalizacji nie włączamy.", "Google Analytics helps us understand which BuildCrew features are used. We do not enable ad personalization.")} {" "}
            <Link href={copy("/polityka-prywatnosci", "/privacy")} className="font-medium text-[var(--bc-ink)] underline underline-offset-2">{copy("Prywatność", "Privacy")}</Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => choose("denied")}>{copy("Tylko niezbędne", "Necessary only")}</Button>
          <Button type="button" size="sm" onClick={() => choose("granted")}>{copy("Zgadzam się na analitykę", "Allow analytics")}</Button>
        </div>
      </div>
    </div>
  );
}
