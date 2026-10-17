"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Rig } from "@/components/stage/types";
import { SERVICES } from "@/data/services";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useI18n } from "@/i18n/I18nProvider";
import { detectAR, type ARMode } from "@/lib/arSupport";
import { hasWebGL } from "@/lib/dom";
import { CARS, carsInFilter, findCar, matchesFilter } from "@/lib/fleet";
import { loadGarage, saveGarage } from "@/lib/storage";
import { applyTheme, resolveTheme, type Theme } from "@/lib/theme";
import type { FilterKey, SortKey } from "@/types/fleet";
import { CompareRatingsCard, CompareSpecsCard } from "./CompareCards";
import { Header } from "./Header";
import { InfoCard } from "./InfoCard";
import { RatingsCard } from "./RatingsCard";
import { Roster } from "./Roster";
import { Showroom } from "./Showroom";
import { Timeline } from "./Timeline";
import { Toolbar, type ToolbarProps } from "./Toolbar";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { usePreloadCars } from "./usePreloadCars";
import { DEFAULT_IDLE_MS, useShowroomTour } from "./useShowroomTour";
import { useSideCardInset } from "./useSideCardInset";
import { VIEWS, ZOOM, clampZoom, shortestTurn, type ViewKey } from "./view";

gsap.registerPlugin(useGSAP);

/** The car-select screen: header, the stage between the info and ratings cards (or the compare cards), and the
    roster. This component owns the state they share; each part handles its own layout and animation.
    `initialCar` opens on a car (the /car/<id> pages); a /#<id> link still wins over it. */
export default function Garage({ initialCar }: { initialCar?: string }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("fleet");
  /** Index into CARS of the car on stage (the right-hand one in compare mode). */
  const [current, setCurrent] = useState(() => Math.max(0, initialCar ? findCar(initialCar) : 0));
  /** Compare mode: index into CARS of the car pinned on the left. */
  const [pinned, setPinned] = useState<number | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [spin, setSpin] = useState(true);
  /** Showroom mode: tour the cars when nobody is using the screen. */
  const [showroom, setShowroom] = useState(false);
  /** How long the screen sits idle before the tour starts; ?showroom=N sets it in seconds. */
  const [tourIdleMs, setTourIdleMs] = useState(DEFAULT_IDLE_MS);
  /** Showroom mode came from a ?showroom link: it lasts for this visit only, until the menu switch is used. */
  const showroomFromLink = useRef(false);
  /** ?capture: render a link preview of the car (scripts/capture.mjs), with nothing else on screen. */
  const [capture, setCapture] = useState(false);
  const [timeline, setTimeline] = useState(false);
  /** Hotspot dots on the car: off until the visitor switches them on. */
  const [hotspots, setHotspots] = useState(false);
  const [ar, setAR] = useState<ARMode | null>(null);
  /** A short message at the foot of the screen (e.g. AR failed to start). */
  const [notice, setNotice] = useState<string | null>(null);
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

  const rig = useRef<Rig>({ yaw: -0.95, spin: true, dragging: false, hold: false, lastInput: -1e9, pulse: 0, wake: () => {}, offscreen: false }).current;
  const mainRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const ratingsRef = useRef<HTMLElement>(null);

  const car = CARS[current];
  const pinnedCar = pinned === null ? null : CARS[pinned];
  const service = SERVICES[car.service];
  const visible = useMemo(() => carsInFilter(filter, sort), [filter, sort]);
  const position = visible.indexOf(current);
  const picked = pick === car.id;
  const focused = (focus && isLg) || capture;
  const inset = useSideCardInset(mainRef, infoRef, ratingsRef, isLg && !capture, focus);
  /** The neighbours a step would land on, fetched ahead of time. */
  const neighbours = useMemo(() => {
    const n = visible.length;
    if (position < 0 || n < 2) return [];
    return [visible[(position + 1) % n], visible[(position - 1 + n) % n]].filter((i) => i !== pinned);
  }, [visible, position, pinned]);
  usePreloadCars(neighbours, !!gl && !capture);

  /* ---------- start-up and saved state ---------- */

  // The <head> script already set data-theme; React's dev remount strips it from <html>, so put it back
  // before paint. Runs before the effect below enables the 3D stage, so the stage mounts lit for this theme.
  useLayoutEffect(() => {
    const initial = resolveTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  // Restore the last visit, then let the page's car (/car/<id>) or a /#car-id link override the car. Auto-spin stays
  // off if it was turned off, or if the visitor prefers reduced motion. A ?showroom link switches showroom mode on,
  // for kiosk screens (?showroom=20 starts the tour after 20 idle seconds instead of 60).
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const params = new URLSearchParams(location.search);
    setReduceMotion(reduce);
    const saved = loadGarage();
    if (saved.pick) setPick(saved.pick);
    if (saved.sort) setSort(saved.sort);
    setHotspots(saved.hotspots === true);
    const last = saved.last ? findCar(saved.last) : -1;
    const page = initialCar ? findCar(initialCar) : -1;
    const linked = findCar(location.hash.slice(1));
    const open = linked >= 0 ? linked : page >= 0 ? page : last;
    if (open >= 0) setCurrent(open);
    setSpin(!reduce && saved.spin !== false);
    const kiosk = params.get("showroom");
    showroomFromLink.current = kiosk !== null && saved.showroom !== true;
    setShowroom(saved.showroom === true || kiosk !== null);
    const idleSeconds = Number(kiosk);
    if (kiosk && idleSeconds >= 5 && idleSeconds <= 600) setTourIdleMs(idleSeconds * 1000);
    if (params.has("capture")) {
      setCapture(true);
      setSpin(false);
      setShowroom(false);
    }
    setGl(hasWebGL());
    setRestored(true);
    detectAR().then(setAR);
  }, [initialCar]);

  useEffect(() => {
    if (restored && !capture) saveGarage({ pick, last: car.id, spin, showroom: showroom && !showroomFromLink.current, sort, hotspots });
  }, [restored, capture, pick, car.id, spin, showroom, sort, hotspots]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  /* ---------- actions ---------- */

  const zoomBy = useCallback((factor: number) => setZoom((z) => clampZoom(z * factor)), []);
  const resetZoom = () => setZoom(1);

  /** Put a car on stage, rolling it in. In compare mode, choosing the pinned car swaps the two sides instead. */
  const goTo = useCallback((i: number) => {
    if (i === current) return;
    if (i === pinned) setPinned(current);
    setCurrent(i);
    setRollKey((k) => k + 1);
    setZoom(1); // each car arrives framed to fit
  }, [current, pinned]);

  /** Next (+1) or previous (-1) car within the filter, wrapping round, and passing over the pinned car. */
  const step = (d: number) => {
    const n = visible.length;
    let at = position;
    for (let tries = 0; tries < n; tries++) {
      at = (at + d + n) % n;
      if (visible[at] !== pinned && visible[at] !== current) return goTo(visible[at]);
    }
  };

  /** Switching filter jumps to its first car (other than the pinned one) if the current one isn't in it. */
  const chooseFilter = (f: FilterKey) => {
    setFilter(f);
    const shown = carsInFilter(f, sort);
    const first = shown.find((i) => i !== pinned);
    if (!shown.includes(current) && first !== undefined) goTo(first);
  };

  /** Compare mode pins the car on stage to the left and brings on the next one beside it (from the whole fleet
      if the filter has no other car); leaving it keeps the right-hand car. */
  const toggleCompare = () => {
    if (pinned !== null) { setPinned(null); return; }
    let pool = visible;
    if (pool.filter((i) => i !== current).length === 0) {
      pool = carsInFilter("all", sort);
      setFilter("all");
    }
    const at = pool.indexOf(current);
    const next = pool[(at + 1) % pool.length] === current ? pool[(at + 2) % pool.length] : pool[(at + 1) % pool.length];
    setPinned(current);
    setCurrent(next);
    setRollKey((k) => k + 1);
    setZoom(1);
  };

  const swapSides = () => {
    if (pinned === null) return;
    setPinned(current);
    setCurrent(pinned);
  };

  const togglePick = () => {
    const next = picked ? null : car.id;
    if (next) { gsap.fromTo(rig, { pulse: 1 }, { pulse: 0, duration: 0.65, ease: "power2.out" }); rig.wake(); }
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
    rig.wake();
  };

  const viewInSpace = () => {
    if (!ar) return;
    import("@/lib/ar")
      .then((m) => m.startAR(car, ar, t.ar))
      .catch(() => setNotice(t.ar.failed));
  };

  /** From the timeline: show that car, widening the filter if it's outside it. */
  const viewFromTimeline = (i: number) => {
    setTimeline(false);
    if (!matchesFilter(CARS[i], filter)) setFilter("all");
    goTo(i);
  };

  // Showroom mode tours the cars in the current filter, spinning each one even with auto-spin off.
  const touring = useShowroomTour(showroom && !capture, () => step(1), tourIdleMs);
  useEffect(() => {
    rig.spin = spin || touring;
    rig.lastInput = -1e9;
    rig.wake();
  }, [spin, touring, rig]);

  useKeyboardShortcuts({
    prev: () => step(-1),
    next: () => step(1),
    togglePick,
    toggleCompare,
    toggleHotspots: () => setHotspots((h) => !h),
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
  }, { dependencies: [focus, isLg, reduceMotion, pinned === null] });

  const toolbar: ToolbarProps = {
    spin, zoom, comparing: pinned !== null, canAR: !!ar, onAim: aim, onSpin: () => setSpin((s) => !s), onCompare: toggleCompare, onAR: viewInSpace,
    onZoomIn: () => zoomBy(ZOOM.step), onZoomOut: () => zoomBy(1 / ZOOM.step), onZoomReset: resetZoom,
  };

  return (
    <div className="garage flex min-h-dvh flex-col overflow-x-hidden bg-night text-ink" style={{ "--accent": service.accent } as CSSProperties}>
      {!capture && (
        <Header
          filter={filter}
          onFilter={chooseFilter}
          sort={sort}
          onSort={setSort}
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
          hotspots={hotspots}
          onToggleHotspots={() => setHotspots((h) => !h)}
          onOpenTimeline={() => setTimeline(true)}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Phones show one column: car, view tools, roster, description, ratings. Below 768 px <main> steps aside
          (display: contents) so its parts and the roster can be put in that order; tablets and up use its grid. */}
      <main
        ref={mainRef}
        className="relative grid min-h-0 flex-1 max-md:contents md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-4 md:p-4 lg:min-h-[540px] lg:grid-cols-[var(--side)_minmax(0,1fr)_var(--side)] lg:gap-5 lg:px-5 lg:py-5"
      >
        <Showroom
          car={car}
          service={service}
          pinned={pinnedCar}
          theme={theme}
          gl={gl}
          rig={rig}
          rollKey={rollKey}
          zoom={zoom}
          onZoom={zoomBy}
          reduceMotion={reduceMotion}
          inset={capture ? 0 : inset}
          isLg={isLg}
          focused={focused}
          picked={picked}
          touring={touring}
          hotspotsOn={hotspots}
          capture={capture}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onToggleFocus={() => setFocus((f) => !f)}
          onExitFocus={() => setFocus(false)}
          toolbar={<Toolbar {...toolbar} className="flex" />}
        />
        {!capture && (pinnedCar ? (
          <>
            <CompareSpecsCard cardRef={infoRef} pinned={pinnedCar} car={car} />
            {gl && <Toolbar {...toolbar} className="mt-3 flex self-center max-md:order-2 md:hidden" />}
            <CompareRatingsCard cardRef={ratingsRef} pinned={pinnedCar} car={car} onSwap={swapSides} onDone={toggleCompare} />
          </>
        ) : (
          <>
            <InfoCard cardRef={infoRef} car={car} service={service} reduceMotion={reduceMotion} />
            {/* phone: the view tools sit in their own row under the car, so they don't cover it */}
            {gl && <Toolbar {...toolbar} className="mt-3 flex self-center max-md:order-2 md:hidden" />}
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
          </>
        ))}
      </main>

      {!capture && (
        <>
          <Roster
            className="max-md:order-3 max-md:mt-3 max-md:border-b"
            order={visible}
            current={current}
            pinned={pinned}
            pick={pick}
            rollKey={rollKey}
            reduceMotion={reduceMotion}
            timeline={filter === "heritage"}
            onOpenTimeline={() => setTimeline(true)}
            onSelect={goTo}
          />

          <footer className="relative z-20 flex flex-wrap max-md:order-6 justify-between gap-x-6 gap-y-1 bg-(--foot) px-gut py-2 text-[10.5px] leading-normal text-dim">
            <span>{t.footer.fleet}</span>
            <span>{t.footer.disclaimer}</span>
            <span className="text-soft">{t.footer.credit}</span>
          </footer>

          <Timeline open={timeline} onClose={() => setTimeline(false)} current={current} onView={viewFromTimeline} reduceMotion={reduceMotion} />
        </>
      )}

      <p
        role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-night shadow-lg transition-opacity duration-300 ${notice ? "opacity-100" : "opacity-0"}`}
      >
        {notice}
      </p>
    </div>
  );
}
