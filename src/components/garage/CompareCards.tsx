import type { CSSProperties, RefObject } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CarThumb } from "@/components/ui/CarThumb";
import { SERVICES } from "@/data/services";
import { useI18n } from "@/i18n/I18nProvider";
import { RATING_KEYS, overallRating } from "@/lib/fleet";
import type { Car, RatingKey } from "@/types/fleet";
import { RATING_ICON } from "./ratingIcons";

/* Compare mode puts these in place of the info and ratings cards: the pinned car is always on the left (as on the
   stage) and the current car on the right, each column marked in its service colour. */


interface CompareProps {
  /** The card's element; the page measures it and slides it away for focus view. */
  cardRef: RefObject<HTMLElement | null>;
  /** The left-hand car. */
  pinned: Car;
  /** The right-hand car, the one the arrows and roster change. */
  car: Car;
}

/** Each column's colour, as a CSS variable for its marks. */
const columnColour = (car: Car) => ({ "--col": SERVICES[car.service].accent }) as CSSProperties;

/** Left card: both cars' pictures and names, then their specs in two columns. */
export function CompareSpecsCard({ cardRef, pinned, car }: CompareProps) {
  const { t, text, number } = useI18n();
  const pair = [pinned, car];
  const rows: [label: string, icon: IconName, value: (c: Car) => string][] = [
    [t.specs.body, "car", (c) => text(c.body)],
    [t.specs.seats, "users", (c) => text(c.seats)],
    [t.specs.power, "bolt", (c) => t.power[c.power]],
    [t.specs.length, "ruler", (c) => `${number(c.profile.L, { max: 2 })} m`],
  ];
  return (
    <section
      ref={cardRef}
      aria-label={t.compare.specs}
      className="glass relative z-10 mx-3 mt-3 flex max-md:order-4 md:col-start-1 md:mx-0 md:mt-0 min-w-0 flex-col overflow-hidden rounded-2xl p-3 [--gap:clamp(8px,calc(4vh_-_17px),22px)] sm:p-4 md:row-start-1 md:p-5 lg:p-4 xl:p-5 2xl:p-6"
    >
      <p className="mb-(--gap) flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[.16em] text-soft md:text-xs">
        <Icon name="compare" className="h-4 w-4 text-(--icon)" /> {t.compare.specs}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {pair.map((c) => (
          <div key={c.id} style={columnColour(c)} className="min-w-0 border-t-2 border-(--col) pt-2">
            <span className="grid h-[clamp(44px,8vh,72px)] grid-cols-1 grid-rows-1 place-items-center">
              <CarThumb car={c} sketch={{ width: 110, height: 44 }} className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,.45)]" />
            </span>
            <p className="mt-1 truncate text-[10px] font-medium uppercase leading-none tracking-[.12em] text-soft md:text-[11px]">{c.maker}</p>
            <p className="mt-1 font-display text-[clamp(18px,1.7vw,26px)] font-bold uppercase leading-[1.02] tracking-[.02em] [overflow-wrap:anywhere]">{c.model}</p>
            <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[.1em] text-(--col) light:brightness-[.6] md:text-[11px]">{SERVICES[c.service].name}</p>
          </div>
        ))}
      </div>
      <dl className="my-auto pt-(--gap)">
        {rows.map(([label, icon, value]) => (
          <div key={label} className="border-t border-edge py-[clamp(7px,1.2vh,13px)]">
            <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase leading-none tracking-[.1em] text-dim md:text-[11px]">
              <Icon name={icon} className="h-4 w-4 flex-none text-soft" /> {label}
            </dt>
            <dd className="mt-1.5 grid grid-cols-2 gap-2.5 text-[12.5px] leading-snug md:text-sm 2xl:text-[15px]">
              {pair.map((c) => <span key={c.id} className="min-w-0">{value(c)}</span>)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Right card: the overall scores, then each rating as two bars growing out from the middle, and the buttons to
    swap sides or leave compare mode. */
export function CompareRatingsCard({ cardRef, pinned, car, onSwap, onDone }: CompareProps & { onSwap: () => void; onDone: () => void }) {
  const { t, number } = useI18n();
  const scores = [overallRating(pinned), overallRating(car)];
  const lead = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
  return (
    <section
      ref={cardRef}
      aria-label={t.compare.ratings}
      className="glass relative z-10 m-3 flex max-md:order-5 md:m-0 min-w-0 flex-col rounded-2xl p-4 [--gap:clamp(12px,2.2vh,24px)] md:col-span-2 md:row-start-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:gap-x-8 md:p-5 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:flex lg:p-4 xl:p-5 2xl:p-6"
    >
      <div className="lg:flex lg:flex-1 lg:flex-col">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[.16em] text-soft md:text-xs">
          <Icon name="info" className="h-4 w-4 text-(--icon)" /> {t.compare.ratings}
        </p>
        {/* overall: the leader's score in gold */}
        <div className="mt-(--gap) grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          {[pinned, car].map((c, i) => (
            <p key={c.id} style={{ ...columnColour(c), order: i ? 3 : 1 }} className={`min-w-0 ${i ? "text-right" : ""}`}>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[.1em] text-dim md:text-[11px]">{c.short}</span>
              <span className={`text-[32px] font-semibold leading-none tabular-nums 2xl:text-[38px] ${lead === i ? "text-plate [text-shadow:0_0_14px_rgba(245,197,24,.4)]" : ""}`}>
                {number(scores[i], { min: 1 })}
              </span>
            </p>
          ))}
          <span style={{ order: 2 }} className="pb-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-dim">{t.compare.overall}</span>
        </div>
        <p className="mt-1.5 text-center text-xs text-soft">{lead < 0 ? t.compare.tie : t.compare.winner([pinned, car][lead].short)}</p>

        <div className="mt-(--gap) grid gap-y-[clamp(12px,2.2vh,24px)] border-t border-edge pt-(--gap) sm:grid-cols-2 sm:gap-x-8 lg:flex lg:flex-1 lg:flex-col lg:justify-evenly">
          {RATING_KEYS.map((key) => (
            <DuelRow key={key} icon={RATING_ICON[key]} label={t.ratings[key]} left={pinned} right={car} rating={key} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2.5 md:mt-0 md:self-center lg:mt-(--gap) lg:self-auto lg:border-t lg:border-edge lg:pt-(--gap)">
        <button
          onClick={onSwap}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-(--pill) text-sm font-semibold uppercase tracking-[.08em] text-soft transition-colors hover:border-brand hover:text-ink"
        >
          <Icon name="swap" className="h-5 w-5" /> {t.compare.swap}
        </button>
        <button
          onClick={onDone}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#ffd84a,#f5b50f)] text-sm font-semibold uppercase tracking-[.08em] text-[#14140f] shadow-[0_0_18px_rgba(245,197,24,.25),inset_0_1px_0_rgba(255,255,255,.5)] transition-[filter] hover:brightness-110"
        >
          <Icon name="check" className="h-5 w-5" strokeWidth={2.6} /> {t.compare.done}
        </button>
      </div>
    </section>
  );
}

/** One rating for both cars: the label, then the left car's bar growing leftward from the middle and the right
    car's rightward, each in its service colour, with the scores at the ends. */
function DuelRow({ icon, label, left, right, rating }: { icon: IconName; label: string; left: Car; right: Car; rating: RatingKey }) {
  const a = left.ratings[rating], b = right.ratings[rating];
  const bar = (c: Car, value: number, side: "l" | "r") => (
    <div style={columnColour(c)} className={`flex h-1.5 overflow-hidden rounded-full bg-(--track) ${side === "l" ? "justify-end" : ""}`}>
      <div
        className="h-full rounded-full bg-(--col) shadow-[0_0_8px_var(--col)] transition-[width] duration-500 ease-out light:brightness-[.75]"
        style={{ width: `${value * 10}%` }}
      />
    </div>
  );
  return (
    <div>
      <p className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold uppercase leading-none tracking-[.12em] md:text-[11px]">
        <Icon name={icon} className="h-4 w-4 text-(--icon)" /> {label}
      </p>
      <div className="mt-2 grid grid-cols-[2ch_1fr_1fr_2ch] items-center gap-1.5 tabular-nums">
        <b className={`text-sm font-semibold ${a > b ? "text-ink" : "text-dim"}`}>{a}</b>
        {bar(left, a, "l")}
        {bar(right, b, "r")}
        <b className={`text-right text-sm font-semibold ${b > a ? "text-ink" : "text-dim"}`}>{b}</b>
      </div>
    </div>
  );
}
