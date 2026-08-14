"use client";

import * as React from "react";

const STORAGE_KEY = "buildcrew-analytics-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsEvent({ name, params }: { name: string; params?: Record<string, string | number | boolean> }) {
  const sent = React.useRef(false);

  React.useEffect(() => {
    function sendIfAllowed() {
      if (sent.current) return;
      try {
        if (window.localStorage.getItem(STORAGE_KEY) !== "granted") return;
      } catch {
        return;
      }
      sent.current = true;
      window.gtag?.("event", name, params ?? {});
    }

    sendIfAllowed();
    window.addEventListener("buildcrew:analytics-consent-change", sendIfAllowed);
    return () => window.removeEventListener("buildcrew:analytics-consent-change", sendIfAllowed);
  }, [name, params]);

  return null;
}
