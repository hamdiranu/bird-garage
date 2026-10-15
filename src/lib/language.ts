import type { Lang, Text } from "@/types/i18n";

/* The interface language: the saved choice, else the browser's language (Indonesian browsers get Indonesian,
   everyone else English). */

const LANG_KEY = "bluebird-lang";

export function resolveLanguage(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "id") return saved;
  } catch {}
  return /^(id|in)\b/i.test(navigator.language) ? "id" : "en";
}

/** Set <html lang> for screen readers and hyphenation, and remember the choice when the visitor made it. */
export function applyLanguage(lang: Lang, save = false) {
  document.documentElement.lang = lang;
  if (save) try { localStorage.setItem(LANG_KEY, lang); } catch {}
}

/** The visitor's version of a piece of text. */
export function localize(text: Text, lang: Lang) {
  return typeof text === "string" ? text : text[lang];
}

/** A number written the local way: "7.5" in English, "7,5" in Indonesian. */
export function formatNumber(value: number, lang: Lang, digits: { min?: number; max?: number } = {}) {
  return new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", {
    minimumFractionDigits: digits.min ?? 0,
    maximumFractionDigits: digits.max ?? digits.min ?? 0,
  }).format(value);
}
