import { useEffect, useRef, type RefObject } from "react";
import { Icon } from "@/components/ui/Icon";
import { CarThumb } from "@/components/ui/CarThumb";
import { SERVICES } from "@/data/services";
import { useI18n } from "@/i18n/I18nProvider";
import { scrollToCentre } from "@/lib/dom";
import { CARS } from "@/lib/fleet";
import { twoDigits } from "@/lib/format";

interface RosterProps {
  /** Indexes into CARS of the cars to list, in order (the filter and sort applied). */
  order: number[];
  /** Index into CARS of the car on stage. */
  current: number;
  /** Compare mode: index of the pinned car. */
  pinned: number | null;
  /** Id of the picked car, if any. */
  pick: string | null;
  /** Bumped when the car changes by navigation, which scrolls smoothly (the first centring jumps). */
  rollKey: number;
  reduceMotion: boolean;
  /** Offer the fleet timeline at the head of the list (the Heritage filter). */
  timeline: boolean;
  onOpenTimeline: () => void;
  onSelect: (index: number) => void;
  /** Placement from the page (phones move the strip up under the car). */
  className?: string;
}

/** The strip of car cards along the bottom, in the filter's sorted order, with the current one kept centred. */
export function Roster({ order, current, pinned, pick, rollKey, reduceMotion, timeline, onOpenTimeline, onSelect, className }: RosterProps) {
  const { t } = useI18n();
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current, card = strip?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (strip && card) scrollToCentre(strip, card, !!rollKey && !reduceMotion);
  }, [current, order, rollKey, reduceMotion]);

  return (
    <nav aria-label={t.roster.label} className={`relative z-20 border-t border-edge bg-[linear-gradient(180deg,var(--roster-a),var(--roster-b))] px-2 py-3 md:px-gut ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <ScrollArrow dir={-1} strip={stripRef} />
        <div ref={stripRef} className="no-scrollbar relative flex min-w-0 flex-1 gap-2.5 overflow-x-auto px-1 py-2 md:gap-3">
          {timeline && (
            <button
              onClick={onOpenTimeline}
              aria-label={t.timeline.open}
              className="group flex w-[132px] flex-none flex-col justify-between rounded-xl border border-dashed border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))] p-2 text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent md:w-[150px] md:p-2.5"
            >
              <Icon name="history" className="h-7 w-7 text-accent transition-transform duration-300 group-hover:-rotate-12" />
              <span>
                <span className="block font-display text-[15px] font-bold uppercase leading-tight tracking-[.03em] md:text-base">{t.timeline.title}</span>
                <span className="block text-[9.5px] font-semibold uppercase tracking-[.14em] text-dim">1972 – 2026</span>
              </span>
            </button>
          )}
          {order.map((i) => {
            const c = CARS[i], on = i === current;
            const chip = pinned === i ? t.compare.pinned : pick === c.id ? t.roster.selected : null;
            return (
              <button
                key={c.id}
                data-i={i}
                aria-current={on || undefined}
                aria-label={`${c.maker} ${c.model}, ${SERVICES[c.service].name}${pinned === i ? ` (${t.compare.pinned})` : ""}`}
                onClick={() => onSelect(i)}
                className={`group relative flex w-[132px] flex-none flex-col rounded-xl border p-2 text-left transition-[transform,border-color,box-shadow] duration-200 md:w-[150px] md:p-2.5 ${on ? "-translate-y-0.5 border-[#5aa6ff] bg-[linear-gradient(180deg,var(--rcard-on-a),var(--rcard-on-b))] shadow-[0_0_0_1px_#5aa6ff,0_0_24px_rgba(61,139,255,.45)]" : pinned === i ? "border-plate/70 bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))]" : "border-edge bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))] hover:-translate-y-0.5 hover:border-[#4a86d9]"}`}
              >
                <span className={`text-[10px] font-semibold leading-none tracking-[.12em] tabular-nums ${on ? "text-ink" : "text-dim"}`}>{twoDigits(i + 1)}</span>
                <span className="my-1 grid h-[58px] grid-cols-1 grid-rows-1 place-items-center md:h-[66px]">
                  <CarThumb car={c} sketch={{ width: 110, height: 44 }} className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:scale-105" />
                </span>
                <span className="truncate font-display text-[15px] font-bold uppercase leading-tight tracking-[.03em] md:text-base">{c.short}</span>
                <span className="truncate text-[9.5px] font-semibold uppercase tracking-[.14em] text-dim">{c.maker}</span>
                {chip && (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-plate px-1.5 pb-px pt-0.5 text-[8.5px] font-bold uppercase leading-none tracking-[.1em] text-[#11131a]">
                    {pinned === i && <Icon name="pin" className="h-2.5 w-2.5" strokeWidth={2.6} />}
                    {chip}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <ScrollArrow dir={1} strip={stripRef} />
      </div>
    </nav>
  );
}

/** Pages the strip by most of its width (hidden on phones, which swipe). */
function ScrollArrow({ dir, strip }: { dir: 1 | -1; strip: RefObject<HTMLDivElement | null> }) {
  const { t } = useI18n();
  return (
    <button
      aria-label={dir < 0 ? t.roster.scrollLeft : t.roster.scrollRight}
      onClick={() => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.7, behavior: "smooth" })}
      className="hidden h-20 w-8 flex-none place-items-center rounded-full border border-edge bg-(--float) text-soft transition-colors hover:border-brand hover:text-ink sm:grid"
    >
      <Icon name={dir < 0 ? "left" : "right"} className="h-5 w-5" />
    </button>
  );
}
