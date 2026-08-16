import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalyticsConsentBanner } from "@/components/analytics/analytics-consent-banner";
import { ANALYTICS_CONSENT_BOOTSTRAP, GoogleAnalytics } from "@/components/analytics/google-analytics";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const SEO = {
  title: "BuildCrew - find people to build projects with",
  description: "Find developers, designers, founders and makers to build real projects with. Discover teams, join projects and build a track record of collaboration.",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "BuildCrew",
  alternates: { canonical: SITE_URL },
  title: SEO.title,
  description: SEO.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BuildCrew",
    title: SEO.title,
    description: SEO.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
  },
};

const themeInitScript = `
try {
  var theme = localStorage.getItem('buildcrew-theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: ANALYTICS_CONSENT_BOOTSTRAP }} />
      </head>
      <body className="bg-[#f4f4ef] text-[#111111] antialiased dark:bg-[#11110f] dark:text-[#f4f4ef]">
        <LocaleProvider locale="en">
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
