import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon, StarFill, type IconName } from "@/components/ui/Icon";
import { RATINGS, overallRating } from "@/lib/fleet";
import type { Car, RatingKey } from "@/types/fleet";

const RATING_ICON: Record<RatingKey, IconName> = { capacity: "seat", comfort: "sofa", eco: "leaf", agility: "city" };

interface RatingsCardProps {
  /** The card's element; the page measures it and slides it away for focus view. */
  cardRef: RefObject<HTMLElement | null>;
  car: Car;
  picked: boolean;
  /** Some car is picked, so "Clear pick" has something to clear. */
  hasPick: boolean;
  onTogglePick: () => void;
  onChangeCar: () => void;
  onClearPick: () => void;
  reduceMotion: boolean;
}

/** Right card: the overall score with stars, a bar per rating, and the select button. On tablets it lays out
    as two columns, ratings beside the button. */
export function RatingsCard({ cardRef, car, picked, hasPick, onTogglePick, onChangeCar, onClearPick, reduceMotion }: RatingsCardProps) {
  const overall = overallRating(car);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const shown = useRef({ value: overall });
  /** Rendered as the score's text at first; afterwards GSAP writes it while counting. */
  const firstScore = useRef(overall.toFixed(1)).current;

  // The overall score counts to its new value.
  useGSAP(() => {
    const el = scoreRef.current;
    if (!el) return;
    const write = () => { el.textContent = shown.current.value.toFixed(1); };
    gsap.to(shown.current, { value: overall, duration: reduceMotion ? 0 : 0.6, ease: "power2.out", overwrite: true, onUpdate: write, onComplete: write });
  }, { dependencies: [overall, reduceMotion] });

  return (
    <section
      ref={cardRef}
      className="glass relative z-10 col-span-2 row-start-3 flex min-w-0 flex-col rounded-2xl p-4 [--gap:clamp(12px,2.2vh,24px)] md:row-start-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:gap-x-8 md:p-5 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:flex lg:p-4 xl:p-5 2xl:p-6"
    >
      <div className="lg:flex lg:flex-1 lg:flex-col">
        {/* overall score: a gold-ringed star, the number and five stars */}
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full border-2 border-[rgba(245,197,24,.7)] bg-[rgba(245,197,24,.08)] text-plate shadow-[0_0_18px_rgba(245,197,24,.22)] 2xl:h-14 2xl:w-14">
            <StarFill className="h-6 w-6 drop-shadow-[0_0_8px_rgba(245,197,24,.6)] 2xl:h-7 2xl:w-7" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-none tracking-[.16em] text-soft md:text-xs">
              Overall rating
              <span title="Ratings are this site's, for fun." className="text-dim">
                <Icon name="info" className="h-3.5 w-3.5" />
                <span className="sr-only">(ratings are this site&apos;s, for fun)</span>
              </span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="flex items-baseline gap-1 leading-none">
                <span ref={scoreRef} className="text-[34px] font-semibold tabular-nums 2xl:text-[40px]">{firstScore}</span>
                <span className="text-sm text-dim">/10</span>
              </p>
              <Stars value={overall / 2} />
            </div>
          </div>
        </div>

        {/* one row per rating: label and score, then its bar; the rows spread out on a tall card */}
        <div className="mt-(--gap) grid gap-x-8 gap-y-[clamp(14px,2.4vh,26px)] border-t border-edge pt-(--gap) sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-col lg:justify-evenly">
          {RATINGS.map(({ key, label }) => (
            <RatingRow key={key} icon={RATING_ICON[key]} label={label} value={car.ratings[key]} />
          ))}
        </div>
      </div>

      <div className="mt-5 md:mt-0 md:self-center lg:mt-(--gap) lg:self-auto lg:border-t lg:border-edge lg:pt-(--gap)">
        <button
          aria-pressed={picked}
          onClick={onTogglePick}
          className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(180deg,#ffd84a,#f5b50f)] text-lg font-semibold uppercase tracking-[.08em] text-[#14140f] transition-[filter,box-shadow] md:text-xl ${picked ? "shadow-[0_0_28px_rgba(245,197,24,.45),inset_0_1px_0_rgba(255,255,255,.5)]" : "shadow-[0_0_18px_rgba(245,197,24,.25),inset_0_1px_0_rgba(255,255,255,.5)] hover:brightness-110"}`}
        >
          {picked && <Icon name="check" className="h-6 w-6" strokeWidth={3} />}
          {picked ? "Selected" : "Select this car"}
          {!picked && <Icon name="arrowRight" className="h-5 w-5" strokeWidth={2.4} />}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-dim">
          <button onClick={onChangeCar} className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 transition-colors hover:text-ink">
            <Icon name="swap" className="h-4 w-4" /> Change car
          </button>
          <span aria-hidden="true">•</span>
          <button
            onClick={onClearPick}
            disabled={!hasPick}
            className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 transition-colors enabled:hover:text-ink disabled:opacity-50"
          >
            <Icon name="x" className="h-4 w-4" /> Clear pick
          </button>
        </div>
      </div>
    </section>
  );
}

function RatingRow({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-edge bg-(--icon-bg) text-(--icon) 2xl:h-11 2xl:w-11">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2 leading-none">
          <span className="text-[11px] font-semibold uppercase tracking-[.12em] md:text-xs">{label}</span>
          <span className="whitespace-nowrap tabular-nums">
            <b className="text-[15px] font-semibold">{value}</b> <span className="text-[11px] text-dim">/10</span>
          </span>
        </p>
        <div aria-hidden="true" className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-(--track)">
          <div className="h-full rounded-full bg-accent shadow-[0_0_10px_var(--accent)] transition-[width,background-color] duration-500 ease-out" style={{ width: `${value * 10}%` }} />
        </div>
      </div>
    </div>
  );
}

/** Five stars, gold up to `value` (0–5) over dim ones. */
function Stars({ value }: { value: number }) {
  const row = (textClass: string) => (
    <span className={`flex gap-0.5 ${textClass}`}>
      {[0, 1, 2, 3, 4].map((i) => <StarFill key={i} className="h-3.5 w-3.5 flex-none" />)}
    </span>
  );
  return (
    <span aria-hidden="true" className="relative inline-flex">
      {row("text-[color-mix(in_srgb,var(--dim)_40%,transparent)]")}
      <span className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-500" style={{ width: `${value * 20}%` }}>
        {row("text-plate")}
      </span>
    </span>
  );
}
