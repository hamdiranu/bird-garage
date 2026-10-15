import { useI18n } from "@/i18n/I18nProvider";
import type { Lang } from "@/types/i18n";

const LANGS: Lang[] = ["en", "id"];

/** EN | ID switch. `compact` drops the outer chip, for use inside the menu. */
export function LanguageToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.language.label}
      className={`items-center gap-0.5 rounded-full ${compact ? "" : "h-10 border border-edge bg-(--chip) p-1 2xl:h-11"} ${className ?? ""}`}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={t.language.names[l]}
          title={t.language.names[l]}
          className={`h-8 rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[.08em] transition-[color,background,border-color,box-shadow] 2xl:h-9 2xl:px-3 2xl:text-xs ${lang === l ? "brand-fill" : "border-transparent text-soft hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
