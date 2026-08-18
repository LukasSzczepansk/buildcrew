"use client";

import * as React from "react";
import type { AppLocale } from "@/lib/site-config";

const LocaleContext = React.createContext<AppLocale>("pl");

export function LocaleProvider({ locale, children }: { locale: AppLocale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return React.useContext(LocaleContext);
}

export function useCopy() {
  const locale = useLocale();
  return React.useCallback(<T,>(pl: T, en: T): T => (locale === "en" ? en : pl), [locale]);
}
