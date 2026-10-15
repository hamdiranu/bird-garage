"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Rig } from "@/components/stage/types";
import { SERVICES } from "@/data/services";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useI18n } from "@/i18n/I18nProvider";
import { hasWebGL } from "@/lib/dom";
import { CARS, carsInFilter, findCar } from "@/lib/fleet";
import { loadGarage, saveGarage } from "@/lib/storage";
import { applyTheme, resolveTheme, type Theme } from "@/lib/theme";
import type { FilterKey } from "@/types/fleet";
import { Header } from "./Header";
import { InfoCard } from "./InfoCard";
import { RatingsCard } from "./RatingsCard";
import { Roster } from "./Roster";
import { Showroom } from "./Showroom";
import { Toolbar, type ToolbarProps } from "./Toolbar";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { DEFAULT_IDLE_MS, useShowroomTour } from "./useShowroomTour";
import { useSideCardInset } from "./useSideCardInset";
import { VIEWS, ZOOM, clampZoom, shortestTurn, type ViewKey } from "./view";

gsap.registerPlugin(useGSAP);

/** The car-select screen: header, the stage between the info and ratings cards, and the roster. This component
    owns the state they share; each part handles its own layout and animation. */
export default function Garage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterKey>("all");
  /** Index into CARS of the car on stage. */
  const [current, setCurrent] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [spin, setSpin] = useState(true);
  /** Showroom mode: tour the cars when nobody is using the screen. */
  const [showroom, setShowroom] = useState(false);
  /** How long the screen sits idle before the tour starts; ?showroom=N sets it in seconds. */
  const [tourIdleMs, setTourIdleMs] = useState(DEFAULT_IDLE_MS);
  /** Showroom mode came from a ?showroom link: it lasts for this visit only, until the menu switch is used. */
  const showroomFromLink = useRef(false);
  const [focus, setFocus] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("dark");
  /** Bumped when the car changes by navigation, so it rolls in. */
  const [rollKey, setRollKey] = useState(0);
  /** Saved state has been restored, so changes can be saved. */
  const [restored, setRestored] = useState(false);
  /** WebGL support: null until checked on the client. */
  const [gl, setGl] = useState<boolean | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isLg = useMediaQuery("(min-width: 1024px)");

  const rig = useRef<Rig>({ yaw: -0.95, spin: true, dragging: false, lastInput: -1e9, pulse: 0 }).current;
  const mainRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const ratingsRef = useRef<HTMLElement>(null);

  const car = CARS[current];
  const service = SERVICES[car.service];
  const visible = useMemo(() => carsInFilter(filter), [filter]);
  const position = visible.indexOf(current);
  const picked = pick === car.id;
  const focused = focus && isLg;
  const inset = useSideCardInset(mainRef, infoRef, ratingsRef, isLg, focus);

  /* ---------- start-up and saved state ---------- */

  // The <head> script already set data-theme; React's dev remount strips it from <html>, so put it back
  // before paint. Runs before the effect below enables the 3D stage, so the stage mounts lit for this theme.
  useLayoutEffect(() => {
    const initial = resolveTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  // Restore the last visit, then let a /#car-id link override the car. Auto-spin stays off if it was turned off,
  // or if the visitor prefers reduced motion. A ?showroom link switches showroom mode on, for kiosk screens
  // (?showroom=20 starts the tour after 20 idle seconds instead of 60).
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduceMotion(reduce);
    const saved = loadGarage();
    if (saved.pick) setPick(saved.pick);
    const last = saved.last ? findCar(saved.last) : -1;
    if (last >= 0) setCurrent(last);
    const linked = findCar(location.hash.slice(1));
    if (linked >= 0) setCurrent(linked);
    setSpin(!reduce && saved.spin !== false);
    const kiosk = new URLSearchParams(location.search).get("showroom");
    showroomFromLink.current = kiosk !== null && saved.showroom !== true;
    setShowroom(saved.showroom === true || kiosk !== null);
    const idleSeconds = Number(kiosk);
    if (kiosk && idleSeconds >= 5 && idleSeconds <= 600) setTourIdleMs(idleSeconds * 1000);
    setGl(hasWebGL());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) saveGarage({ pick, last: car.id, spin, showroom: showroom && !showroomFromLink.current });
  }, [restored, pick, car.id, spin, showroom]);

  /* ---------- actions ---------- */

  const zoomBy = useCallback((factor: number) => setZoom((z) => clampZoom(z * factor)), []);
  const resetZoom = () => setZoom(1);

  const goTo = useCallback((i: number) => {
    if (i === current) return;
    setCurrent(i);
    setRollKey((k) => k + 1);
    setZoom(1); // each car arrives framed to fit
  }, [current]);

  /** Next (+1) or previous (-1) car within the filter, wrapping round. */
  const step = (d: number) => goTo(visible[(position + d + visible.length) % visible.length]);

  /** Switching filter jumps to its first car if the current one isn't in it. */
  const chooseFilter = (f: FilterKey) => {
    setFilter(f);
    const shown = carsInFilter(f);
    if (!shown.includes(current)) goTo(shown[0]);
  };

  const togglePick = () => {
    const next = picked ? null : car.id;
    if (next) gsap.fromTo(rig, { pulse: 1 }, { pulse: 0, duration: 0.65, ease: "power2.out" });
    setPick(next);
  };

  // Flipping data-theme starts the CSS transitions (theme tokens, photo cross-fade); the 3D lights follow via `theme`.
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  };

  /** Turn to a preset view the short way round (stops auto-spin). */
  const aim = (view: ViewKey) => {
    setSpin(false);
    gsap.to(rig, { yaw: rig.yaw + shortestTurn(rig.yaw, VIEWS[view]), duration: reduceMotion ? 0 : 0.8, ease: "power3.inOut", overwrite: "auto" });
  };

  // Showroom mode tours the cars in the current filter, spinning each one even with auto-spin off.
  const touring = useShowroomTour(showroom, () => step(1), tourIdleMs);
  useEffect(() => {
    rig.spin = spin || touring;
    rig.lastInput = -1e9;
  }, [spin, touring, rig]);

  useKeyboardShortcuts({
    prev: () => step(-1),
    next: () => step(1),
    togglePick,
    toggleFocus: isLg ? () => setFocus((f) => !f) : undefined,
    exitFocus: () => setFocus(false),
    zoomIn: () => zoomBy(ZOOM.step),
    zoomOut: () => zoomBy(1 / ZOOM.step),
    resetZoom,
  });

  // Focus view: the side cards slide off the screen edges (large screens only).
  useGSAP(() => {
    const cards = [infoRef.current, ratingsRef.current];
    if (!cards[0] || !cards[1]) return;
    if (!isLg) { gsap.set(cards, { clearProps: "transform,opacity,visibility" }); return; }
    const d = reduceMotion ? 0 : 0.6;
    gsap.to(cards[0], { xPercent: focus ? -125 : 0, autoAlpha: focus ? 0 : 1, duration: d, ease: "power3.inOut" });
    gsap.to(cards[1], { xPercent: focus ? 125 : 0, autoAlpha: focus ? 0 : 1, duration: d, ease: "power3.inOut" });
  }, { dependencies: [focus, isLg, reduceMotion] });

  const toolbar: ToolbarProps = {
    spin, zoom, onAim: aim, onSpin: () => setSpin((s) => !s),
    onZoomIn: () => zoomBy(ZOOM.step), onZoomOut: () => zoomBy(1 / ZOOM.step), onZoomReset: resetZoom,
  };

  return (
    <div className="garage flex min-h-dvh flex-col overflow-x-hidden bg-night text-ink" style={{ "--accent": service.accent } as CSSProperties}>
      <Header
        filter={filter}
        onFilter={chooseFilter}
        position={position}
        count={visible.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        focus={focus}
        canFocus={isLg}
        onToggleFocus={() => setFocus((f) => !f)}
        spin={spin}
        onToggleSpin={() => setSpin((s) => !s)}
        showroom={showroom}
        onToggleShowroom={() => { showroomFromLink.current = false; setShowroom((s) => !s); }}
        reduceMotion={reduceMotion}
      />

      <main
        ref={mainRef}
        className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-4 md:p-4 lg:min-h-[540px] lg:grid-cols-[var(--side)_minmax(0,1fr)_var(--side)] lg:gap-5 lg:px-5 lg:py-5"
      >
        <Showroom
          car={car}
          service={service}
          theme={theme}
          gl={gl}
          rig={rig}
          rollKey={rollKey}
          zoom={zoom}
          onZoom={zoomBy}
          reduceMotion={reduceMotion}
          inset={inset}
          isLg={isLg}
          focused={focused}
          picked={picked}
          touring={touring}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onToggleFocus={() => setFocus((f) => !f)}
          onExitFocus={() => setFocus(false)}
          toolbar={<Toolbar {...toolbar} className="flex" />}
        />
        <InfoCard cardRef={infoRef} car={car} service={service} reduceMotion={reduceMotion} />
        {/* phone: the view tools sit in their own row so they don't cover the car */}
        {gl && <Toolbar {...toolbar} className="col-span-2 row-start-2 flex justify-self-center md:hidden" />}
        <RatingsCard
          cardRef={ratingsRef}
          car={car}
          picked={picked}
          hasPick={!!pick}
          onTogglePick={togglePick}
          onChangeCar={() => step(1)}
          onClearPick={() => setPick(null)}
          reduceMotion={reduceMotion}
        />
      </main>

      <Roster current={current} filter={filter} pick={pick} rollKey={rollKey} reduceMotion={reduceMotion} gl={gl} onSelect={goTo} />

      <footer className="relative z-20 flex flex-wrap justify-between gap-x-6 gap-y-1 bg-(--foot) px-gut py-2 text-[10.5px] leading-normal text-dim">
        <span>{t.footer.fleet}</span>
        <span>{t.footer.disclaimer}</span>
        <span className="text-soft">{t.footer.credit}</span>
      </footer>
    </div>
  );
}
