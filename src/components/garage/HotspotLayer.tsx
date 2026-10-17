import { useEffect, useState, type RefObject } from "react";
import type { Rig } from "@/components/stage/types";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import type { Car } from "@/types/fleet";

interface HotspotLayerProps {
  car: Car;
  /** One element per hotspot; the stage's render loop moves each over its point on the car and fades it by
      --facing (see Scene.tsx). */
  els: RefObject<(HTMLElement | null)[]>;
  rig: Rig;
}

/** Tappable dots over the car's points of interest. Tapping one opens its note and holds the car still; a tap
    anywhere else, or Esc, closes it. The dots fade out round the far side of the car. */
export function HotspotLayer({ car, els, rig }: HotspotLayerProps) {
  const { t, text } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    rig.hold = open !== null;
    rig.wake();
    return () => { rig.hold = false; rig.wake(); };
  }, [open, rig]);

  useEffect(() => {
    if (open === null) return;
    const onPointer = (e: PointerEvent) => {
      if (!els.current[open]?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, els]);

  const list = car.hotspots ?? [];
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {list.map((h, i) => {
        const kind = t.hotspots[h.kind];
        const on = open === i;
        return (
          <div
            key={`${car.id}-${i}`}
            ref={(el) => { els.current[i] = el; }}
            data-hidden="true"
            // parked off screen until the render loop places it
            style={{ transform: "translate3d(-200px,-200px,0)" }}
            className={`group absolute left-0 top-0 opacity-(--facing,0) will-change-transform ${on ? "z-10" : ""}`}
          >
            <button
              aria-expanded={on}
              aria-label={kind.title}
              title={kind.title}
              onClick={() => setOpen(on ? null : i)}
              className="pointer-events-auto absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full group-data-[hidden=true]:pointer-events-none"
            >
              {/* a soft pulse behind a white-ringed dot in the service colour */}
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-accent/40 motion-safe:animate-ping" />
              <span aria-hidden="true" className={`relative h-3.5 w-3.5 rounded-full border-2 border-white bg-accent shadow-[0_0_10px_rgba(0,0,0,.5)] transition-transform ${on ? "scale-125" : ""}`} />
            </button>
            {on && (
              <div
                role="note"
                className="glass pointer-events-auto absolute bottom-5 left-1/2 w-56 -translate-x-1/2 rounded-xl px-3.5 pb-3 pt-2.5 text-left"
              >
                <p className="flex items-start justify-between gap-2 text-[11px] font-semibold uppercase leading-tight tracking-[.12em] text-accent">
                  {kind.title}
                  <button onClick={() => setOpen(null)} aria-label={t.hotspots.close} className="-mr-1 -mt-0.5 text-dim transition-colors hover:text-ink">
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-soft">{text(h.note ?? kind.note)}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
