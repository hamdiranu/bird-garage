import { useEffect, useRef, type RefObject } from "react";
import { Icon } from "@/components/ui/Icon";
import SideView from "@/components/ui/SideView";
import { SERVICES } from "@/data/services";
import { useI18n } from "@/i18n/I18nProvider";
import { scrollToCentre } from "@/lib/dom";
import { CARS, matchesFilter } from "@/lib/fleet";
import { twoDigits } from "@/lib/format";
import type { FilterKey } from "@/types/fleet";
import { useCarThumbnails } from "./useCarThumbnails";

interface RosterProps {
  /** Index into CARS of the car on stage. */
  current: number;
  filter: FilterKey;
  /** Id of the picked car, if any. */
  pick: string | null;
  /** Bumped when the car changes by navigation, which scrolls smoothly (the first centring jumps). */
  rollKey: number;
  reduceMotion: boolean;
  /** WebGL support: thumbnails of the 3D models need it, otherwise the cards keep their 2D drawings. */
  gl: boolean | null;
  onSelect: (index: number) => void;
}

/** The strip of car cards along the bottom. Cards outside the filter are hidden, and the current one is kept
    centred. */
export function Roster({ current, filter, pick, rollKey, reduceMotion, gl, onSelect }: RosterProps) {
  const { t } = useI18n();
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbs = useCarThumbnails(gl);

  useEffect(() => {
    const strip = stripRef.current, card = strip?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (strip && card) scrollToCentre(strip, card, !!rollKey && !reduceMotion);
  }, [current, filter, rollKey, reduceMotion]);

  return (
    <nav aria-label={t.roster.label} className="relative z-20 border-t border-edge bg-[linear-gradient(180deg,var(--roster-a),var(--roster-b))] px-2 py-3 md:px-gut">
      <div className="flex items-center gap-2">
        <ScrollArrow dir={-1} strip={stripRef} />
        <div ref={stripRef} className="no-scrollbar relative flex min-w-0 flex-1 gap-2.5 overflow-x-auto px-1 py-2 md:gap-3">
          {CARS.map((c, i) => {
            const on = i === current;
            return (
              <button
                key={c.id}
                data-i={i}
                hidden={!matchesFilter(c, filter)}
                aria-current={on || undefined}
                aria-label={`${c.maker} ${c.model}, ${SERVICES[c.service].name}`}
                onClick={() => onSelect(i)}
                className={`group relative flex w-[132px] flex-none flex-col rounded-xl border p-2 text-left transition-[transform,border-color,box-shadow] duration-200 md:w-[150px] md:p-2.5 ${on ? "-translate-y-0.5 border-[#5aa6ff] bg-[linear-gradient(180deg,var(--rcard-on-a),var(--rcard-on-b))] shadow-[0_0_0_1px_#5aa6ff,0_0_24px_rgba(61,139,255,.45)]" : "border-edge bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))] hover:-translate-y-0.5 hover:border-[#4a86d9]"}`}
              >
                <span className={`text-[10px] font-semibold leading-none tracking-[.12em] tabular-nums ${on ? "text-ink" : "text-dim"}`}>{twoDigits(i + 1)}</span>
                <span className="my-1 grid h-[58px] place-items-center md:h-[66px]">
                  {thumbs[c.id] ? (
                    // a data URL rendered in the browser, so next/image has nothing to optimise
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[c.id]} alt="" className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <SideView car={c} width={110} height={44} pad={3} className="block" />
                  )}
                </span>
                <span className="truncate font-display text-[15px] font-bold uppercase leading-tight tracking-[.03em] md:text-base">{c.short}</span>
                <span className="truncate text-[9.5px] font-semibold uppercase tracking-[.14em] text-dim">{c.maker}</span>
                {pick === c.id && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-plate px-1.5 pb-px pt-0.5 text-[8.5px] font-bold uppercase leading-none tracking-[.1em] text-[#11131a]">{t.roster.selected}</span>
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
