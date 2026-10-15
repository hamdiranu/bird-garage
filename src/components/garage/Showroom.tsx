import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Frame, Rig } from "@/components/stage/types";
import { Icon } from "@/components/ui/Icon";
import SideView from "@/components/ui/SideView";
import { useElementSize } from "@/hooks/useElementSize";
import { backdropStyle } from "@/lib/backdrop";
import type { Theme } from "@/lib/theme";
import type { Car, Service } from "@/types/fleet";
import { EdgeHandle, FocusButton, NavButton } from "./StageButtons";

// Client only, and split out so three.js isn't in the page's first bundle.
const Stage = dynamic(() => import("@/components/stage/Stage"), { ssr: false });

/** Edge shading behind the side cards, darkest at the screen edges and clear across the middle. */
const EDGE_SHADE =
  "linear-gradient(90deg, color-mix(in srgb, var(--shade) 55%, transparent) 0, color-mix(in srgb, var(--shade) 25%, transparent) calc(var(--inset) - 30px), transparent calc(var(--inset) + 80px), transparent calc(100% - var(--inset) - 80px), color-mix(in srgb, var(--shade) 25%, transparent) calc(100% - var(--inset) + 30px), color-mix(in srgb, var(--shade) 55%, transparent) 100%)";

interface ShowroomProps {
  car: Car;
  service: Service;
  theme: Theme;
  /** WebGL support: null until checked. */
  gl: boolean | null;
  rig: Rig;
  rollKey: number;
  zoom: number;
  onZoom: (factor: number) => void;
  reduceMotion: boolean;
  /** How far the side cards reach into the stage (large screens). */
  inset: number;
  isLg: boolean;
  focused: boolean;
  picked: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFocus: () => void;
  onExitFocus: () => void;
  /** The toolbar, floated along the bottom of the stage from tablet up. */
  toolbar: ReactNode;
}

/** The stage: the showroom photo with the 3D car on its platform (or a 2D drawing without WebGL), the overlay
    above it and the buttons around it. A grid cell on small screens; full-bleed behind the cards on large ones. */
export function Showroom({
  car, service, theme, gl, rig, rollKey, zoom, onZoom, reduceMotion, inset, isLg, focused, picked,
  onPrev, onNext, onToggleFocus, onExitFocus, toolbar,
}: ShowroomProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLParagraphElement>(null);
  const viewSize = useElementSize(viewRef);

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
  }, [focused, picked, gl]);
  // On large screens the prev/next buttons sit at mid-height beside the car, so leave room for them.
  const frame = useMemo<Frame>(() => ({ side: inset, ...hud, gutter: isLg ? 70 : 10 }), [inset, hud, isLg]);

  // Focus view: the title drops in once the cards have started sliding away…
  useGSAP(() => {
    if (!focused || !titleRef.current) return;
    const d = reduceMotion ? 0 : 0.6;
    gsap.fromTo(titleRef.current, { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d, delay: d * 0.4, ease: "power3.out" });
  }, { dependencies: [focused, reduceMotion] });
  // …and its lines step in again for each car.
  useGSAP(() => {
    if (!titleRef.current || !focused || reduceMotion) return;
    gsap.fromTo(titleRef.current.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" });
  }, { dependencies: [car.id] });
  // The "Selected" stamp pops in.
  useGSAP(() => {
    if (!picked || !stampRef.current || reduceMotion) return;
    gsap.fromTo(stampRef.current, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" });
  }, { dependencies: [picked, car.id, reduceMotion] });

  return (
    <div
      ref={viewRef}
      style={{ "--inset": `${inset}px` } as CSSProperties}
      className="relative col-start-2 row-start-1 min-h-[clamp(360px,60vh,480px)] min-w-0 overflow-hidden rounded-2xl border border-edge bg-night lg:absolute lg:inset-0 lg:col-start-auto lg:row-start-auto lg:min-h-0 lg:rounded-none lg:border-0"
    >
      {/* night and day photos, cross-faded by data-theme (both load up front, so the first switch doesn't flash);
          the stage scales this layer with the zoom */}
      <div ref={backdropRef} aria-hidden="true" className="absolute inset-0 will-change-transform">
        <div style={backdropStyle("dark")} className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(.4,0,.2,1)] light:opacity-0" />
        <div style={backdropStyle("light")} className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-[cubic-bezier(.4,0,.2,1)] light:opacity-100" />
      </div>
      {gl && (
        <Stage
          car={car} accent={service.accent} rollKey={rollKey} rig={rig} reduceMotion={reduceMotion} frame={frame} theme={theme}
          zoom={zoom} onZoom={onZoom} backdrop={backdropRef}
        />
      )}
      {gl === false && (
        <>
          <SideView car={car} width={Math.max(200, viewSize.width)} height={Math.max(160, viewSize.height)} pad={Math.max(30, viewSize.width * 0.12)} className="absolute inset-0" />
          <p className="absolute inset-x-4 bottom-[70px] z-[2] text-center text-xs text-dim">
            This browser has WebGL switched off, so the 3D view can&apos;t run. Showing the side profile instead.
          </p>
        </>
      )}

      {/* edge shading behind the cards (lifts away in focus view), and top and bottom fades */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[1] hidden transition-opacity duration-500 lg:block ${focused ? "opacity-0" : "opacity-100"}`}
        style={{ background: EDGE_SHADE }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-[color-mix(in_srgb,var(--shade)_70%,transparent)] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-[color-mix(in_srgb,var(--shade)_80%,transparent)] to-transparent" />

      {/* top overlay: drag hint, or the car's title in focus view; then the "Selected" stamp */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-x-0 top-3 z-[2] flex flex-col items-center gap-2 px-3 text-center md:top-5 md:px-12">
        {focused ? (
          <div ref={titleRef} className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-semibold uppercase tracking-[.3em] text-soft">{car.maker}</p>
            <h2 className="font-display text-[clamp(40px,4.6vw,68px)] font-extrabold italic uppercase leading-[.9] tracking-[.01em] [text-shadow:0_4px_30px_var(--title-glow)]">{car.model}</h2>
            <p className="mt-1 rounded-full border border-accent/70 bg-(--float) px-4 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-accent">
              {service.name} · {service.role}
            </p>
          </div>
        ) : (
          gl && (
            <p className="flex items-center gap-2 whitespace-nowrap rounded-full bg-(--float) px-3 py-1.5 md:px-3.5 text-[10px] font-medium uppercase leading-[1.3] tracking-[.16em] text-soft backdrop-blur-sm md:text-xs">
              <Icon name="hand" className="h-4 w-4 flex-none md:h-5 md:w-5" />
              <span className="sm:hidden">Drag · Pinch</span>
              <span className="hidden sm:inline lg:hidden">Drag to rotate · Pinch to zoom</span>
              <span className="hidden lg:inline">Drag to rotate · Scroll to zoom</span>
            </p>
          )
        )}
        {picked && (
          <p
            ref={stampRef}
            className="rounded-full border-2 border-plate bg-(--float) px-5 pb-1 pt-1.5 text-xs font-semibold uppercase leading-none tracking-[.14em] text-plate shadow-[0_0_18px_rgba(245,197,24,.35)] md:text-sm"
          >
            Selected
          </p>
        )}
      </div>

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
    </div>
  );
}
