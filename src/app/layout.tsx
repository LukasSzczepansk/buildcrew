import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalyticsConsentBanner } from "@/components/analytics/analytics-consent-banner";
import { ANALYTICS_CONSENT_BOOTSTRAP, GoogleAnalytics } from "@/components/analytics/google-analytics";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getRequestLocale } from "@/lib/site-server";
import { openGraphLocale, siteUrlForLocale, SITE_URL_EN, SITE_URL_PL } from "@/lib/site-config";
import "./globals.css";

const SEO = {
  pl: {
    title: "BuildCrew - projekty do portfolio i ludzie do wspólnego budowania",
    description: "Znajdź ludzi do projektu, zbudujcie coś razem i twórz historię realnej współpracy. Projekty do portfolio, zespoły i sieć builderów w jednym miejscu.",
  },
  en: {
    title: "BuildCrew - find people to build projects with",
    description: "Find people for your project, build together and create a track record of real collaboration. Projects, teams and builders in one place.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale];
  return {
    metadataBase: new URL(siteUrlForLocale(locale)),
    applicationName: "BuildCrew",
    alternates: {
      canonical: siteUrlForLocale(locale),
      languages: { "pl-PL": SITE_URL_PL, "en-US": SITE_URL_EN, "x-default": SITE_URL_EN },
    },
    title: seo.title,
    description: seo.description,
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      siteName: "BuildCrew",
      title: seo.title,
      description: seo.description,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
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
    <html lang={locale} suppressHydrationWarning>
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
