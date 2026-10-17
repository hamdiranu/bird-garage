import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Frame, HotspotDots, RigRef } from "@/components/stage/types";
import { Icon } from "@/components/ui/Icon";
import SideView from "@/components/ui/SideView";
import { useElementSize } from "@/hooks/useElementSize";
import { useI18n } from "@/i18n/I18nProvider";
import { backdropAnchor, backdropStyle } from "@/lib/backdrop";
import type { Theme } from "@/lib/theme";
import type { Car, Service } from "@/types/fleet";
import { HotspotLayer } from "./HotspotLayer";
import { EdgeHandle, FocusButton, NavButton } from "./StageButtons";
import { useLoadProgress } from "./useLoadProgress";

// Client only, and split out so three.js isn't in the page's first bundle.
const Stage = dynamic(() => import("@/components/stage/Stage"), { ssr: false });

/** Edge shading behind the side cards, darkest at the screen edges and clear across the middle. */
const EDGE_SHADE =
  "linear-gradient(90deg, color-mix(in srgb, var(--shade) 55%, transparent) 0, color-mix(in srgb, var(--shade) 25%, transparent) calc(var(--inset) - 30px), transparent calc(var(--inset) + 80px), transparent calc(100% - var(--inset) - 80px), color-mix(in srgb, var(--shade) 25%, transparent) calc(100% - var(--inset) + 30px), color-mix(in srgb, var(--shade) 55%, transparent) 100%)";

interface ShowroomProps {
  car: Car;
  service: Service;
  /** Compare mode: the other car, standing to the left of `car`. */
  pinned: Car | null;
  theme: Theme;
  /** WebGL support: null until checked. */
  gl: boolean | null;
  rigRef: RigRef;
  rollKey: number;
  zoom: number;
  onZoom: (factor: number) => void;
  reduceMotion: boolean;
  /** How far the side cards reach into the stage (large screens). */
  inset: number;
  isLg: boolean;
  focused: boolean;
  picked: boolean;
  /** Showroom mode is touring the cars on its own. */
  touring: boolean;
  /** The visitor has the hotspot dots switched on. */
  hotspotsOn: boolean;
  /** Rendering a link preview: just the car and its title, no buttons (see scripts/capture.mjs). */
  capture: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFocus: () => void;
  onExitFocus: () => void;
  /** The toolbar, floated along the bottom of the stage from tablet up. */
  toolbar: ReactNode;
}

/** The stage: the showroom photo with the 3D car on its platform (or a 2D drawing without WebGL), the overlay
    above it, the hotspot dots and the buttons around it. The top grid cell on phones, beside the info card on
    tablets, and full-bleed behind the cards on large screens. */
export function Showroom({
  car, service, pinned, theme, gl, rigRef, rollKey, zoom, onZoom, reduceMotion, inset, isLg, focused, picked, touring, hotspotsOn, capture,
  onPrev, onNext, onToggleFocus, onExitFocus, toolbar,
}: ShowroomProps) {
  const { t, text } = useI18n();
  const viewRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLParagraphElement>(null);
  const dotRefs = useRef<(HTMLElement | null)[]>([]);
  const viewSize = useElementSize(viewRef);
  const loading = useLoadProgress(pinned ? [pinned.id, car.id] : [car.id]);
  const [ready, setReady] = useState(false);

  // Hotspots show when switched on, on a single car the visitor is exploring.
  const showDots = hotspotsOn && !!gl && !pinned && !touring && !capture && !!car.hotspots?.length;
  const hotspots = useMemo<HotspotDots | null>(() => (showDots ? { list: car.hotspots!, els: dotRefs } : null), [showDots, car.hotspots]);

  // How much of the stage the top overlay (hint/title) and the toolbar cover, so the car sits between them.
  const [hud, setHud] = useState({ top: 0, bottom: 0 });
  useLayoutEffect(() => {
    const v = viewRef.current, o = overlayRef.current, t = toolbarRef.current;
    if (!v || !o) return;
    const measure = () => {
      const vr = v.getBoundingClientRect(), or = o.getBoundingClientRect();
      const top = or.height ? Math.round(or.bottom - vr.top + 8) : 0;
      const bottom = t?.offsetParent ? Math.round(vr.bottom - t.getBoundingClientRect().top + 8) : 0;
      setHud((h) => (h.top === top && h.bottom === bottom ? h : { top, bottom }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    ro.observe(o);
    return () => ro.disconnect();
  }, [focused, picked, gl, pinned]);
  // On large screens the prev/next buttons sit at mid-height beside the car, so leave room for them.
  const frame = useMemo<Frame>(() => ({ side: inset, ...hud, gutter: isLg && !capture ? 70 : 10 }), [inset, hud, isLg, capture]);

  // The car's title shows in focus view, and on a link preview.
  const titled = (focused || capture) && !pinned;

  // Focus view: the title drops in once the cards have started sliding away…
  useGSAP(() => {
    if (!titled || !titleRef.current || capture) return;
    const d = reduceMotion ? 0 : 0.6;
    gsap.fromTo(titleRef.current, { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d, delay: d * 0.4, ease: "power3.out" });
  }, { dependencies: [titled, reduceMotion] });
  // …and its lines step in again for each car.
  useGSAP(() => {
    if (!titleRef.current || !titled || reduceMotion || capture) return;
    gsap.fromTo(titleRef.current.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" });
  }, { dependencies: [car.id] });
  // The "Selected" stamp pops in.
  useGSAP(() => {
    if (!picked || !stampRef.current || reduceMotion) return;
    gsap.fromTo(stampRef.current, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" });
  }, { dependencies: [picked, car.id, reduceMotion] });

  const platform = backdropAnchor(viewSize.width, viewSize.height);

  return (
    <div
      ref={viewRef}
      data-ready={ready || undefined}
      style={{ "--inset": `${inset}px` } as CSSProperties}
      className="relative mx-3 mt-3 min-h-[clamp(300px,46vh,420px)] min-w-0 max-md:order-1 md:col-start-2 md:row-start-1 md:mx-0 md:mt-0 md:min-h-[clamp(360px,60vh,480px)] overflow-hidden rounded-2xl border border-edge bg-night lg:absolute lg:inset-0 lg:col-start-auto lg:row-start-auto lg:min-h-0 lg:rounded-none lg:border-0"
    >
      {/* night and day photos, cross-faded by data-theme (both load up front, so the first switch doesn't flash);
          the stage scales this layer with the zoom */}
      <div ref={backdropRef} aria-hidden="true" className="absolute inset-0 will-change-transform">
        <div style={backdropStyle("dark")} className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(.4,0,.2,1)] light:opacity-0" />
        <div style={backdropStyle("light")} className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-[cubic-bezier(.4,0,.2,1)] light:opacity-100" />
      </div>
      {gl && (
        <Stage
          car={car} pinned={pinned} label={pinned ? `${t.stage.model(pinned.maker, pinned.model)} ${t.stage.model(car.maker, car.model)}` : t.stage.model(car.maker, car.model)}
          accent={service.accent} rollKey={rollKey} rigRef={rigRef} reduceMotion={reduceMotion} frame={frame} theme={theme}
          zoom={zoom} onZoom={onZoom} backdropRef={backdropRef} hotspots={hotspots} onReady={capture ? () => setReady(true) : undefined}
        />
      )}
      {gl === false && (
        <>
          <SideView car={car} width={Math.max(200, viewSize.width)} height={Math.max(160, viewSize.height)} pad={Math.max(30, viewSize.width * 0.12)} className="absolute inset-0" />
          <p className="absolute inset-x-4 bottom-[70px] z-[2] text-center text-xs text-dim">
            {t.stage.noWebGL}
          </p>
        </>
      )}

      {/* edge shading behind the cards (lifts away in focus view), and top and bottom fades */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[1] hidden transition-opacity duration-500 lg:block ${focused || capture ? "opacity-0" : "opacity-100"}`}
        style={{ background: EDGE_SHADE }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-[color-mix(in_srgb,var(--shade)_70%,transparent)] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-[color-mix(in_srgb,var(--shade)_80%,transparent)] to-transparent" />

      {hotspots && <HotspotLayer key={car.id} car={car} els={dotRefs} rigRef={rigRef} />}

      {/* the loading ring stands on the platform while a model downloads */}
      {gl && loading !== null && viewSize.width > 0 && (
        <LoadingRing value={loading} label={t.stage.loading} style={{ left: platform.x, top: platform.y - Math.min(90, platform.r * 0.35) }} />
      )}

      {/* top overlay: the two names in compare mode; the car's title in focus view; the showroom-mode badge while
          touring; otherwise the drag hint. Then the "Selected" stamp */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-x-0 top-3 z-[2] flex flex-col items-center gap-2 px-3 text-center md:top-5 md:px-12">
        {pinned ? (
          <>
            <p className="flex max-w-full items-center gap-2.5 rounded-full border border-edge bg-(--float) px-4 py-1.5 font-display text-base font-bold uppercase leading-none tracking-[.04em] backdrop-blur-sm md:text-xl">
              <span className="truncate">{pinned.short}</span>
              <span className="font-hud text-[10px] font-semibold tracking-[.2em] text-plate md:text-xs">{t.compare.vs}</span>
              <span className="truncate">{car.short}</span>
            </p>
            <p className="hidden text-[11px] text-dim md:block">{t.stage.comparing}</p>
          </>
        ) : titled ? (
          <div ref={titleRef} className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-semibold uppercase tracking-[.3em] text-soft">{car.maker}</p>
            <h2 className="font-display text-[clamp(40px,4.6vw,68px)] font-extrabold italic uppercase leading-[.9] tracking-[.01em] [text-shadow:0_4px_30px_var(--title-glow)]">{car.model}</h2>
            <p className="mt-1 rounded-full border border-accent/70 bg-(--float) px-4 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-accent">
              {service.name} · {text(service.role)}
            </p>
          </div>
        ) : touring ? (
          <p className="flex items-center gap-2 whitespace-nowrap rounded-full border border-accent/60 bg-(--float) px-3 py-1.5 text-[10px] font-semibold uppercase leading-[1.3] tracking-[.16em] text-accent backdrop-blur-sm md:px-3.5 md:text-xs">
            <Icon name="play" className="h-4 w-4 flex-none md:h-5 md:w-5" />
            {t.stage.touring}
          </p>
        ) : (
          gl && (
            <p className="flex items-center gap-2 whitespace-nowrap rounded-full bg-(--float) px-3 py-1.5 md:px-3.5 text-[10px] font-medium uppercase leading-[1.3] tracking-[.16em] text-soft backdrop-blur-sm md:text-xs">
              <Icon name="hand" className="h-4 w-4 flex-none md:h-5 md:w-5" />
              <span className="sm:hidden">{t.stage.hintPhone}</span>
              <span className="hidden sm:inline lg:hidden">{t.stage.hintTablet}</span>
              <span className="hidden lg:inline">{t.stage.hintDesktop}</span>
            </p>
          )
        )}
        {picked && !pinned && !capture && (
          <p
            ref={stampRef}
            className="rounded-full border-2 border-plate bg-(--float) px-5 pb-1 pt-1.5 text-xs font-semibold uppercase leading-none tracking-[.14em] text-plate shadow-[0_0_18px_rgba(245,197,24,.35)] md:text-sm"
          >
            {t.stage.selected}
          </p>
        )}
      </div>

      {!capture && (
        <>
          <NavButton dir="prev" onClick={onPrev} />
          <NavButton dir="next" onClick={onNext} />
          {isLg && <FocusButton focused={focused} onClick={onToggleFocus} />}
          {focused && (
            <>
              <EdgeHandle side="left" onClick={onExitFocus} />
              <EdgeHandle side="right" onClick={onExitFocus} />
            </>
          )}
          {gl && (
            <div ref={toolbarRef} className="absolute bottom-5 left-1/2 z-[3] hidden -translate-x-1/2 md:block">
              {toolbar}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A ring that fills as the model downloads, centred on `style`'s left/top; it spins instead when the size is
    unknown. */
function LoadingRing({ value, label, style }: { value: number; label: string; style: CSSProperties }) {
  const known = Number.isFinite(value), r = 22, c = 2 * Math.PI * r;
  const percent = known ? Math.round(value * 100) : null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
      style={style}
      className="pointer-events-none absolute z-[2] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--float) backdrop-blur-sm"
    >
      <svg viewBox="0 0 56 56" className={`absolute inset-1 ${known ? "-rotate-90" : "motion-safe:animate-spin"}`} aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--track)" strokeWidth="3.5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke="var(--accent-ui)" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={known ? c * (1 - value) : c * 0.7}
          className="transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <span className="text-[11px] font-semibold tabular-nums text-soft">{percent !== null ? `${percent}%` : ""}</span>
    </div>
  );
}
