import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismiss } from "@/hooks/useDismiss";
import { useI18n } from "@/i18n/I18nProvider";
import { SORT_KEYS } from "@/lib/fleet";
import type { SortKey } from "@/types/fleet";

/** The sort button beside the service filters, and its list of orders. It shows the chosen order's name where
    there's room (and lights up when it isn't the fleet order); the list closes on a pick, a click outside or Esc. */
export function SortMenu({ sort, onChange }: { sort: SortKey; onChange: (sort: SortKey) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(open, () => ref.current, () => setOpen(false));

  const sorted = sort !== "fleet";
  return (
    <div ref={ref} className="relative flex-none">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.sort.title}: ${t.sort.options[sort]}`}
        title={t.sort.title}
        className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold uppercase leading-none tracking-[.03em] transition-[color,background,border-color] 2xl:h-10 2xl:px-3.5 2xl:text-xs ${sorted ? "border-brand/60 bg-[rgba(47,139,255,.14)] text-ink" : "border-transparent bg-(--pill) text-soft hover:border-edge hover:text-ink"}`}
      >
        <Icon name="sort" className="h-[18px] w-[18px]" />
        <span className="hidden xl:inline">{sorted ? t.sort.options[sort] : t.sort.label}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={t.sort.title} className="menu-panel absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-2xl p-1.5">
          {SORT_KEYS.map((key) => (
            <li key={key} role="option" aria-selected={key === sort}>
              <button
                onClick={() => { onChange(key); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(47,139,255,.12)] ${key === sort ? "text-ink" : "text-soft"}`}
              >
                {t.sort.options[key]}
                {key === sort && <Icon name="check" className="h-4 w-4 text-(--icon)" strokeWidth={2.4} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
