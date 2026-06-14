"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { dict, DEFAULT_LOCALE, type Dict, type Locale } from "./dictionary";

type I18nValue = {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // English-only: locale is fixed. setLocale is kept as a no-op so any
  // lingering callers don't break.
  const [locale] = useState<Locale>(DEFAULT_LOCALE);

  const setLocale = useCallback((_l: Locale) => {
    /* no-op: the app is English-only */
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: dict[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
