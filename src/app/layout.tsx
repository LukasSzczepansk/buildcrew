import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildCrew — Znajdź ludzi i zbuduj coś razem",
  description:
    "BuildCrew łączy programistów, designerów i product builderów, którzy chcą razem tworzyć aplikacje, strony i produkty cyfrowe.",
};

const themeInitScript = `
try {
  var theme = localStorage.getItem('buildcrew-theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>

      <body className="bg-[#f4f4ef] text-[#111111] antialiased dark:bg-[#11110f] dark:text-[#f4f4ef]">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>

      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}