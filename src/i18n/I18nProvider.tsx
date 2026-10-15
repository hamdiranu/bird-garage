"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { applyLanguage, formatNumber, localize, resolveLanguage } from "@/lib/language";
import type { Lang, Text } from "@/types/i18n";
import { MESSAGES, type Messages } from "./messages";

interface I18n {
  lang: Lang;
  /** Switch language (and remember the choice). */
  setLang: (lang: Lang) => void;
  /** The interface strings in the current language. */
  t: Messages;
  /** The current language's version of a piece of data text. */
  text: (text: Text) => string;
  /** A number written the local way. */
  number: (value: number, digits?: { min?: number; max?: number }) => string;
}

const I18nContext = createContext<I18n | null>(null);

/** Holds the interface language for everything under it. The page is prerendered in English; the saved or
    browser language takes over as soon as it hydrates. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useLayoutEffect(() => {
    const resolved = resolveLanguage();
    applyLanguage(resolved);
    setLangState(resolved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    applyLanguage(next, true);
    setLangState(next);
  }, []);

  const value = useMemo<I18n>(() => ({
    lang,
    setLang,
    t: MESSAGES[lang],
    text: (text) => localize(text, lang),
    number: (n, digits) => formatNumber(n, lang, digits),
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n must be used inside <I18nProvider>");
  return i18n;
}
