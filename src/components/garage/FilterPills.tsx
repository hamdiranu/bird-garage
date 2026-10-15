import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FILTERS, SERVICES, filterBadge } from "@/data/services";
import { scrollToCentre } from "@/lib/dom";
import type { FilterKey } from "@/types/fleet";

/** One pill per service, plus All. The strip scrolls sideways when it runs out of room: an edge fades only while
    pills are hidden past it, and the active pill is kept in view. */
export function FilterPills({ filter, onChange, reduceMotion }: { filter: FilterKey; onChange: (f: FilterKey) => void; reduceMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  /** Which ends of the strip have pills scrolled out of view. */
  const [hidden, setHidden] = useState({ l: false, r: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const l = el.scrollLeft > 1, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setHidden((h) => (h.l === l && h.r === r ? h : { l, r }));
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener("scroll", check, { passive: true });
    document.fonts?.ready.then(check);
    return () => { ro.disconnect(); el.removeEventListener("scroll", check); };
  }, []);

  useEffect(() => {
    const el = ref.current, on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el && on) scrollToCentre(el, on, !reduceMotion);
  }, [filter, reduceMotion]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Filter by service"
      className="no-scrollbar relative col-span-2 -mx-gut flex min-w-0 gap-1 overflow-x-auto px-gut pb-2.5 md:mx-0 md:flex-1 md:justify-center-safe md:px-0 md:py-2.5 2xl:gap-1.5"
      style={{
        maskImage: `linear-gradient(90deg, ${hidden.l ? "transparent" : "#000"}, #000 28px, #000 calc(100% - 28px), ${hidden.r ? "transparent" : "#000"})`,
      }}
    >
      {FILTERS.map((k) => {
        const on = filter === k;
        return (
          <button
            key={k}
            aria-pressed={on}
            onClick={() => onChange(k)}
            title={k === "all" ? "All services" : `${SERVICES[k].name} · ${SERVICES[k].role}`}
            className={`flex h-9 flex-none items-center gap-1 whitespace-nowrap rounded-full border px-[9px] text-[11px] font-semibold uppercase leading-none tracking-[.03em] transition-[color,background,border-color,box-shadow] 2xl:h-10 2xl:gap-1.5 2xl:px-3.5 2xl:text-xs 2xl:tracking-[.07em] ${on ? "brand-fill" : "border-transparent bg-(--pill) text-soft hover:border-edge hover:text-ink"}`}
          >
            {/* on the blue active pill, a thin white halo keeps the blue badge from blending in */}
            <Image
              src={filterBadge(k)}
              alt=""
              width={22}
              height={22}
              className={`h-[18px] w-[18px] 2xl:h-[22px] 2xl:w-[22px] ${on ? "drop-shadow-[0_0_1.5px_rgba(255,255,255,.95)]" : ""}`}
            />
            {k === "all" ? "All" : SERVICES[k].name}
          </button>
        );
      })}
    </div>
  );
}
