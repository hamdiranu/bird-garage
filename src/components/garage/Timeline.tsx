import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { CarThumb } from "@/components/ui/CarThumb";
import { TIMELINE } from "@/data/timeline";
import { useI18n } from "@/i18n/I18nProvider";
import { scrollToCentre } from "@/lib/dom";
import { CARS, findCar } from "@/lib/fleet";

interface TimelineProps {
  open: boolean;
  onClose: () => void;
  /** Index into CARS of the car on stage, marked on the timeline. */
  current: number;
  onView: (index: number) => void;
  reduceMotion: boolean;
}

/** The group's story, oldest first, as a strip of milestones on a line that scrolls sideways. A modal dialog
    across the bottom of the screen: Esc or a click on the dimmed page closes it, and each milestone's car can be
    put on stage. */
export function Timeline({ open, onClose, current, onView, reduceMotion }: TimelineProps) {
  const { t, text } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // start at the milestone of the car on stage, if it has one
      const here = strip.current?.querySelector<HTMLElement>("[data-current]");
      if (strip.current && here) scrollToCentre(strip.current, here, false);
    } else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="timeline-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className={`glass fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-none rounded-t-3xl border-b-0 p-0 text-ink backdrop:bg-[rgba(3,8,20,.55)] backdrop:backdrop-blur-[2px] ${reduceMotion ? "" : "open:animate-[sheet-up_.45s_cubic-bezier(.2,.8,.2,1)]"}`}
    >
      <div className="flex items-start justify-between gap-4 px-gut pb-1 pt-4 md:pt-5">
        <div>
          <h2 id="timeline-title" className="flex items-center gap-2.5 font-display text-2xl font-extrabold italic uppercase leading-none tracking-[.02em] md:text-3xl">
            <Icon name="history" className="h-6 w-6 text-accent" /> {t.timeline.title}
          </h2>
          <p className="mt-1.5 text-xs text-soft md:text-sm">{t.timeline.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          aria-label={t.timeline.close}
          className="grid h-10 w-10 flex-none place-items-center rounded-full border border-edge text-soft transition-colors hover:border-brand hover:text-ink"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>
      </div>

      <ol ref={strip} className="no-scrollbar relative flex snap-x gap-4 overflow-x-auto px-gut pb-6 pt-4 md:gap-5">
        {TIMELINE.map((m, i) => {
          const index = m.car ? findCar(m.car) : -1;
          const car = index >= 0 ? CARS[index] : null;
          const here = index === current;
          return (
            <li key={m.year} data-current={here || undefined} className="relative flex w-[220px] flex-none snap-center flex-col md:w-[250px]">
              {/* the line through the year dots, running on to the next milestone */}
              <span aria-hidden="true" className={`absolute top-[15px] h-px bg-[linear-gradient(90deg,var(--accent-ui),color-mix(in_srgb,var(--accent-ui)_30%,transparent))] ${i === TIMELINE.length - 1 ? "left-3 right-1/2" : "-right-5 left-3"}`} />
              <p className="relative flex items-center gap-2.5">
                <span aria-hidden="true" className={`h-[11px] w-[11px] flex-none rounded-full border-2 border-accent ${here ? "bg-plate" : "bg-night"}`} />
                <span className="font-display text-[26px] font-extrabold italic leading-none text-plate [text-shadow:0_0_12px_rgba(245,197,24,.35)]">{m.year}</span>
              </p>
              <div className={`mt-3 flex flex-1 flex-col rounded-xl border p-3 ${here ? "border-[#5aa6ff] bg-[linear-gradient(180deg,var(--rcard-on-a),var(--rcard-on-b))]" : "border-edge bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))]"}`}>
                {car && (
                  <span className="mb-2 grid h-[72px] flex-none grid-cols-1 grid-rows-1 place-items-center">
                    <CarThumb car={car} sketch={{ width: 130, height: 52 }} className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,.5)]" />
                  </span>
                )}
                <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-[.03em]">{text(m.title)}</h3>
                <p className="mt-1 flex-1 text-[12.5px] leading-snug text-soft">{text(m.note)}</p>
                {car && (
                  <button
                    onClick={() => onView(index)}
                    className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-edge px-3 py-2 text-left text-xs font-semibold uppercase tracking-[.08em] text-soft transition-colors hover:border-brand hover:text-ink"
                  >
                    <span className="min-w-0 truncate">{t.timeline.view} · {car.short}</span>
                    <Icon name="arrowRight" className="h-4 w-4 flex-none" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </dialog>
  );
}
