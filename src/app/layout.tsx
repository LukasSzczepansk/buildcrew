import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalyticsConsentBanner } from "@/components/analytics/analytics-consent-banner";
import { ANALYTICS_CONSENT_BOOTSTRAP, GoogleAnalytics } from "@/components/analytics/google-analytics";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getRequestLocale } from "@/lib/site-server";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const SEO = {
  pl: {
    title: "BuildCrew - znajdź ludzi do wspólnego budowania",
    description: "Znajdź developerów, designerów, founderów i projekty. Buduj zespół, portfolio i sieć kontaktów przez realną współpracę.",
  },
  en: {
    title: "BuildCrew - find people to build with",
    description: "Find developers, designers, founders and projects. Build teams, proof of work and a professional network through real collaboration.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale];
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "BuildCrew",
    alternates: { canonical: SITE_URL },
    title: seo.title,
    description: seo.description,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "pl_PL",
      siteName: "BuildCrew",
      title: seo.title,
      description: seo.description,
      url: SITE_URL,
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  };
}

const themeInitScript = `
try {
  var theme = localStorage.getItem('buildcrew-theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale === "en" ? "en" : "pl"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: ANALYTICS_CONSENT_BOOTSTRAP }} />
      </head>
      <body className="bg-[#f4f4ef] text-[#111111] antialiased dark:bg-[#11110f] dark:text-[#f4f4ef]">
        <LocaleProvider locale={locale}>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <AnalyticsConsentBanner />
          </ThemeProvider>
          <GoogleAnalytics />
        </LocaleProvider>
      </body>
    </html>
  );
}
