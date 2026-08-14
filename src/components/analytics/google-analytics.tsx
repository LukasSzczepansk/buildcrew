"use client";

import * as React from "react";
import Script from "next/script";

const DEFAULT_GA_ID = "G-4XG6GNLFEC";
const STORAGE_KEY = "buildcrew-analytics-consent";

export const ANALYTICS_CONSENT_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
`;

export function GoogleAnalytics() {
  const [enabled, setEnabled] = React.useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim() || DEFAULT_GA_ID;

  React.useEffect(() => {
    try {
      const granted = window.localStorage.getItem(STORAGE_KEY) === "granted";
      setEnabled(granted);
      if (granted) {
        window.gtag?.("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    } catch {
      setEnabled(false);
    }

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ choice?: string }>).detail;
      setEnabled(detail?.choice === "granted");
    };
    window.addEventListener("buildcrew:analytics-consent-change", handleChange);
    return () => window.removeEventListener("buildcrew:analytics-consent-change", handleChange);
  }, []);

  if (!enabled) return null;

  const init = `
gtag('js', new Date());
gtag('config', '${gaId}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
`;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="buildcrew-ga-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: init }} />
    </>
  );
}
