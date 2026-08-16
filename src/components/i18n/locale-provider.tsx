"use client";

import * as React from "react";
import type { AppLocale } from "@/lib/site-config";

const ENGLISH_LOCALE: AppLocale = "en";
const LocaleContext = React.createContext<AppLocale>(ENGLISH_LOCALE);

/**
 * BuildCrew is an English-first product. Keep the provider API in place so
 * existing components do not need to be rewritten, but always expose English.
 */
export function LocaleProvider({ children }: { locale?: AppLocale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={ENGLISH_LOCALE}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return ENGLISH_LOCALE;
}

/**
 * Compatibility helper for the old bilingual copy(pl, en) calls.
 * English is now the only product language, so always return the EN branch.
 */
export function useCopy() {
  return React.useCallback(<T,>(_pl: T, en: T): T => en, []);
}
