import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalyticsConsentBanner } from "@/components/analytics/analytics-consent-banner";
import { ANALYTICS_CONSENT_BOOTSTRAP, GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "BuildCrew",
  title: DEFAULT_SEO_TITLE,
  description: DEFAULT_SEO_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "BuildCrew",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
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
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: ANALYTICS_CONSENT_BOOTSTRAP }} />
      </head>
      <body className="bg-[#f4f4ef] text-[#111111] antialiased dark:bg-[#11110f] dark:text-[#f4f4ef]">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <AnalyticsConsentBanner />
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
