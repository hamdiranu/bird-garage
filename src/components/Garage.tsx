"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CARS, CLASSES, MAKER_LOGO, ORDER, STATS, type FilterKey, type StatKey } from "@/lib/fleet";
import SideView from "./SideView";
import Image from "next/image";
import { Icon, StarFill, type IconName } from "./Icon";
import type { Frame, Rig } from "./Stage";
import { backdropStyle } from "@/lib/backdrop";
import { applyTheme, resolveTheme, type Theme } from "@/lib/theme";

gsap.registerPlugin(useGSAP); 

const Stage = dynamic(() => import("./Stage"), { ssr: false });

const STORE = "bluebird-fleet-select";
const ANG = { front: -Math.PI / 2, side: 0, rear: Math.PI / 2 } as const;
/** Vehicle zoom: range over the fitted view, and the factor per button press or key. */
const ZOOM = { min: 0.75, max: 2.5, step: 1.25 };
type ViewKey = keyof typeof ANG;
const pad = (n: number) => (n < 10 ? "0" : "") + n;

/** Each service's badge (public/icons). All wears the Bluebird badge; Heritage the old outline logo. */
const CLASS_BADGE: Record<FilterKey, string> = {
  all: "bluebird", bluebird: "bluebird", silverbird: "silverbird", goldenbird: "goldenbird",
  bigbird: "bigbird", cititrans: "cititrans", heritage: "heritage",
};
const STAT_ICON: Record<StatKey, IconName> = { cap: "seat", comfort: "sofa", eco: "leaf", agile: "city" };
const VIEW_ICON: Record<ViewKey, IconName> = { front: "front", side: "car", rear: "rear" };

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMedia(q: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return on;
}

export default function Garage() {
  const [filter, setFilterState] = useState<FilterKey>("all");
  const [cur, setCur] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [spin, setSpin] = useState(true);
  const [focus, setFocus] = useState(false);
  const [menu, setMenu] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("dark");
  const [rollKey, setRollKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);
  const [reduce, setReduce] = useState(false);
  const [viewSize, setViewSize] = useState({ w: 400, h: 300 });
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [inset, setInset] = useState(0);
  const [hud, setHud] = useState({ top: 0, bottom: 0 });
  const isLg = useMedia("(min-width: 1024px)");

  const rig = useRef<Rig>({ yaw: -0.95, spin: true, dragging: false, lastInput: -1e9, pulse: 0 }).current;
  const mainRef = useRef<HTMLElement>(null);
  const identRef = useRef<HTMLElement>(null);
  const ratingsRef = useRef<HTMLElement>(null);
  const modelRef = useRef<HTMLHeadingElement>(null);
  const stampRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const overallRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  /** Which ends of the filter strip have pills scrolled out of view. */
  const [pillsHidden, setPillsHidden] = useState({ l: false, r: false });
  const overlayRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const car = CARS[cur];
  const cl = CLASSES[car.cls];
  const logo = MAKER_LOGO[car.maker];
  const list = CARS.map((c, i) => (filter === "all" || c.cls === filter ? i : -1)).filter((i) => i >= 0);
  const at = list.indexOf(cur);
  const picked = pick === car.id;
  const overall = STATS.reduce((s, [k]) => s + car.r[k], 0) / STATS.length;
  const shownOverall = useRef({ v: overall });
  const firstOverall = useRef(overall.toFixed(1)).current;
  const focused = focus && isLg;

  // The <head> script already set data-theme; React's dev remount strips it from <html>, so put it back
  // before paint. Runs before the effect below enables the 3D stage, so the stage mounts lit for this theme.
  useLayoutEffect(() => {
    const t = resolveTheme();
    applyTheme(t);
    setTheme(t);
  }, []);

  /* ---------- restore saved state, URL hash, motion preference ---------- */
  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduce(rm);
    let spinOn = !rm;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
      if (typeof saved.pick === "string") setPick(saved.pick);
      if (typeof saved.last === "string") {
        const li = CARS.findIndex((c) => c.id === saved.last);
        if (li >= 0) setCur(li);
      }
      if (saved.spin === false) spinOn = false;
    } catch {}
    const hi = CARS.findIndex((c) => c.id === location.hash.slice(1));
    if (hi >= 0) setCur(hi);
    setSpin(spinOn);
    setGl(hasWebGL());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ pick, last: car.id, spin }));
    } catch {}
  }, [loaded, pick, car.id, spin]);

  useEffect(() => {
    rig.spin = spin;
    rig.lastInput = -1e9;
  }, [spin, rig]);

  // Roster pictures: render each 3D model once, after the main scene has had a head start.
  useEffect(() => {
    if (!gl) return;
    let live = true;
    const t = setTimeout(() => {
      import("@/lib/thumbs")
        .then((m) => m.renderThumbs(CARS))
        .then((out) => { if (live) setThumbs(out); })
        .catch(() => {});
    }, 700);
    return () => { live = false; clearTimeout(t); };
  }, [gl]);

  /* ---------- actions ---------- */
  const zoomBy = useCallback((f: number) => setZoom((z) => Math.min(ZOOM.max, Math.max(ZOOM.min, z * f))), []);

  const goTo = useCallback((i: number) => {
    if (i === cur) return;
    setCur(i);
    setRollKey((k) => k + 1);
    setZoom(1); // each car arrives framed to fit
  }, [cur]);

  const step = useCallback(
    (d: number) => goTo(list[(at + d + list.length) % list.length]),
    [goTo, list, at],
  );

  const setFilter = (k: FilterKey) => {
    setFilterState(k);
    const l = CARS.map((c, i) => (k === "all" || c.cls === k ? i : -1)).filter((i) => i >= 0);
    if (!l.includes(cur)) goTo(l[0]);
  };

  const togglePick = useCallback(() => {
    const next = pick === car.id ? null : car.id;
    if (next) gsap.fromTo(rig, { pulse: 1 }, { pulse: 0, duration: 0.65, ease: "power2.out" });
    setPick(next);
  }, [pick, car.id, rig]);

  // Flipping data-theme starts the CSS transitions (theme tokens, photo cross-fade); the 3D lights follow via `theme`.
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  };

  const aim = (view: ViewKey) => {
    setSpin(false);
    const target = ANG[view];
    const d = ((((target - rig.yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    gsap.to(rig, { yaw: rig.yaw + d, duration: reduce ? 0 : 0.8, ease: "power3.inOut", overwrite: "auto" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const onButton = document.activeElement?.tagName === "BUTTON";
      if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
      else if (e.key === "Enter" && !onButton) { togglePick(); e.preventDefault(); }
      else if ((e.key === "f" || e.key === "F") && isLg) setFocus((f) => !f);
      else if (e.key === "Escape") { setMenu(false); setFocus(false); }
      else if (e.key === "+" || e.key === "=") zoomBy(ZOOM.step);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / ZOOM.step);
      else if (e.key === "0") setZoom(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, togglePick, isLg, zoomBy]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  /* ---------- layout effects ---------- */
  // Shrink the model name until it fits its card.
  const fitModel = useCallback(() => {
    const m = modelRef.current;
    if (!m) return;
    m.style.fontSize = "";
    let fs = parseFloat(getComputedStyle(m).fontSize) || 48;
    while (m.scrollWidth > m.clientWidth + 1 && fs > 20) {
      fs -= 2;
      m.style.fontSize = fs + "px";
    }
  }, []);
  useLayoutEffect(fitModel, [car, fitModel]);
  useEffect(() => {
    window.addEventListener("resize", fitModel);
    document.fonts?.ready.then(fitModel);
    return () => window.removeEventListener("resize", fitModel);
  }, [fitModel]);

  // How much of the full-bleed stage the side cards cover, so the camera frames the car between them.
  useLayoutEffect(() => {
    const main = mainRef.current, l = identRef.current, r = ratingsRef.current;
    if (!main || !l || !r) return;
    const calc = () => {
      if (!isLg) setInset(0);
      else if (focus) setInset(44);
      else setInset(Math.max(l.offsetLeft + l.offsetWidth, main.clientWidth - r.offsetLeft) + 6);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(main);
    return () => ro.disconnect();
  }, [isLg, focus]);

  // How much of the stage the top overlay (hint/title) and the toolbar cover, so the car sits between them.
  useLayoutEffect(() => {
    const v = viewRef.current, o = overlayRef.current, t = toolbarRef.current;
    if (!v || !o) return;
    const calc = () => {
      const vr = v.getBoundingClientRect(), or = o.getBoundingClientRect();
      const top = or.height ? Math.round(or.bottom - vr.top + 8) : 0;
      const bottom = t?.offsetParent ? Math.round(vr.bottom - t.getBoundingClientRect().top + 8) : 0;
      setHud((h) => (h.top === top && h.bottom === bottom ? h : { top, bottom }));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(v);
    ro.observe(o);
    return () => ro.disconnect();
  }, [focused, picked, gl]);
  // On large screens the prev/next buttons sit at mid-height beside the car, so leave room for them.
  const frame = useMemo<Frame>(() => ({ side: inset, ...hud, gutter: isLg ? 70 : 10 }), [inset, hud, isLg]);

  // Filter pills: fade an edge only while pills are scrolled out past it, and keep the active one in view.
  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const check = () => {
      const l = el.scrollLeft > 1, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setPillsHidden((h) => (h.l === l && h.r === r ? h : { l, r }));
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener("scroll", check, { passive: true });
    document.fonts?.ready.then(check);
    return () => { ro.disconnect(); el.removeEventListener("scroll", check); };
  }, []);
  useEffect(() => {
    const el = pillsRef.current, on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (el && on) el.scrollTo({ left: on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [filter, reduce]);

  // Keep the current roster card centred.
  useEffect(() => {
    const strip = stripRef.current;
    const b = strip?.querySelector<HTMLElement>(`[data-i="${cur}"]`);
    if (!strip || !b) return;
    strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: rollKey && !reduce ? "smooth" : "auto" });
  }, [cur, filter, rollKey, reduce]);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const ro = new ResizeObserver(([e]) => setViewSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(v);
    return () => ro.disconnect();
  }, []);

  /* ---------- GSAP ---------- */
  // Card contents step in on every car change.
  useGSAP(
    () => {
      if (reduce) return;
      gsap.fromTo("[data-anim]", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.045, overwrite: true });
      gsap.fromTo(modelRef.current, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power4.out" });
    },
    { scope: identRef, dependencies: [cur, reduce] },
  );

  // Focus view: the side cards slide off and the title drops in over the stage.
  useGSAP(() => {
    const l = identRef.current, r = ratingsRef.current;
    if (!l || !r) return;
    if (!isLg) { gsap.set([l, r], { clearProps: "transform,opacity,visibility" }); return; }
    const d = reduce ? 0 : 0.6;
    gsap.to(l, { xPercent: focus ? -125 : 0, autoAlpha: focus ? 0 : 1, duration: d, ease: "power3.inOut" });
    gsap.to(r, { xPercent: focus ? 125 : 0, autoAlpha: focus ? 0 : 1, duration: d, ease: "power3.inOut" });
    if (focus && titleRef.current)
      gsap.fromTo(titleRef.current, { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d, delay: d * 0.4, ease: "power3.out" });
  }, { dependencies: [focus, isLg, reduce] });

  useGSAP(() => {
    if (!titleRef.current || !focused || reduce) return;
    gsap.fromTo(titleRef.current.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" });
  }, { dependencies: [cur] });

  // Overall score counts to its new value.
  useGSAP(() => {
    const el = overallRef.current;
    if (!el) return;
    const write = () => { el.textContent = shownOverall.current.v.toFixed(1); };
    gsap.to(shownOverall.current, { v: overall, duration: reduce ? 0 : 0.6, ease: "power2.out", overwrite: true, onUpdate: write, onComplete: write });
  }, { dependencies: [overall, reduce] });

  useGSAP(() => {
    if (!picked || !stampRef.current || reduce) return;
    gsap.fromTo(stampRef.current, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" });
  }, { dependencies: [picked, cur, reduce] });

  const toolbar = {
    spin, zoom, onAim: aim, onSpin: () => setSpin((s) => !s),
    onZoomIn: () => zoomBy(ZOOM.step), onZoomOut: () => zoomBy(1 / ZOOM.step), onZoomReset: () => setZoom(1),
  };

  /* ---------- render ---------- */
  return (
    <div
      className="garage flex min-h-dvh flex-col overflow-x-hidden bg-night text-ink"
      style={{ "--accent": cl.accent } as CSSProperties}
    >
      {/* ===== header ===== */}
      {/* One row from tablet up: logo | filter pills (scroll sideways if they run out of room) | counter.
          Phones put the pills on a row of their own. */}
      <header className="relative z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-edge bg-[linear-gradient(180deg,var(--hdr-a),var(--hdr-b))] px-gut shadow-[0_8px_30px_-12px_var(--drop)] backdrop-blur-md md:flex md:gap-x-2 2xl:gap-x-5">
        <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 py-2.5 md:flex-none" aria-label="Bird Garage">
          <Image src="/icons/bluebird.png" alt="" width={44} height={44} loading="eager" className="h-9 w-9 drop-shadow-[0_2px_10px_rgba(61,139,255,.45)] 2xl:h-11 2xl:w-11" />
          <span className="whitespace-nowrap bg-gradient-to-b from-(--title-a) to-(--title-b) bg-clip-text pr-1 font-display text-[21px] font-extrabold italic uppercase leading-none tracking-[.02em] -translate-y-[.12em] text-transparent sm:text-[24px] xl:text-[28px] 2xl:text-[32px]">
            Bird Garage
          </span>
        </a>

        <div className="flex items-center gap-2 md:order-last md:flex-none">
          <div aria-live="polite" aria-atomic="true" className="flex h-10 items-center gap-2 rounded-full border border-edge bg-(--chip) px-3.5 tabular-nums 2xl:h-11 2xl:px-4">
            <Icon name="car" className="hidden h-5 w-5 text-soft xl:block" />
            <b className="font-display text-[22px] font-bold leading-none text-plate [text-shadow:0_0_12px_rgba(245,197,24,.45)] 2xl:text-[26px]">{pad(at + 1)}</b>
            <span className="text-xs font-semibold text-dim">/ {pad(list.length)}</span>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} className="hidden sm:grid" />
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-label="Menu"
              className="grid h-10 w-10 place-items-center rounded-full text-soft transition-colors hover:text-ink 2xl:h-11 2xl:w-11"
            >
              <Icon name={menu ? "x" : "menu"} className="h-6 w-6" />
            </button>
            {menu && (
              <Menu
                focus={focus}
                canFocus={isLg}
                spin={spin}
                light={theme === "light"}
                onTheme={toggleTheme}
                onFocus={() => { setFocus((f) => !f); setMenu(false); }}
                onSpin={() => setSpin((s) => !s)}
              />
            )}
          </div>
        </div>

        <div
          ref={pillsRef}
          role="group"
          aria-label="Filter by service"
          className="no-scrollbar relative col-span-2 -mx-gut flex min-w-0 gap-1 overflow-x-auto px-gut pb-2.5 md:mx-0 md:flex-1 md:justify-center-safe md:px-0 md:py-2.5 2xl:gap-1.5"
          style={{
            maskImage: `linear-gradient(90deg, ${pillsHidden.l ? "transparent" : "#000"}, #000 28px, #000 calc(100% - 28px), ${pillsHidden.r ? "transparent" : "#000"})`,
          }}
        >
          {ORDER.map((k) => {
            const on = filter === k;
            return (
              <button
                key={k}
                aria-pressed={on}
                onClick={() => setFilter(k)}
                title={k === "all" ? "All services" : `${CLASSES[k].name} · ${CLASSES[k].role}`}
                className={`flex h-9 flex-none items-center gap-1 whitespace-nowrap rounded-full border px-[9px] text-[11px] font-semibold uppercase leading-none tracking-[.03em] transition-[color,background,border-color,box-shadow] 2xl:h-10 2xl:gap-1.5 2xl:px-3.5 2xl:text-xs 2xl:tracking-[.07em] ${on ? "brand-fill" : "border-transparent bg-(--pill) text-soft hover:border-edge hover:text-ink"}`}
              >
                {/* on the blue active pill, a thin white halo keeps the blue badge from blending in */}
                <Image
                  src={`/icons/${CLASS_BADGE[k]}.png`}
                  alt=""
                  width={22}
                  height={22}
                  className={`h-[18px] w-[18px] 2xl:h-[22px] 2xl:w-[22px] ${on ? "drop-shadow-[0_0_1.5px_rgba(255,255,255,.95)]" : ""}`}
                />
                {k === "all" ? "All" : CLASSES[k].name}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===== garage ===== */}
      <main
        ref={mainRef}
        className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-4 md:p-4 lg:min-h-[540px] lg:grid-cols-[var(--side)_minmax(0,1fr)_var(--side)] lg:gap-5 lg:px-5 lg:py-5"
      >
        {/* stage: a grid cell on small screens, full-bleed behind the cards on large ones */}
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
              car={car} accent={cl.accent} rollKey={rollKey} rig={rig} reduceMotion={reduce} frame={frame} theme={theme}
              zoom={zoom} onZoom={zoomBy} backdrop={backdropRef}
            />
          )}
          {gl === false && (
            <>
              <SideView car={car} width={Math.max(200, viewSize.w)} height={Math.max(160, viewSize.h)} pad={Math.max(30, viewSize.w * 0.12)} className="absolute inset-0" />
              <p className="absolute inset-x-4 bottom-[70px] z-[2] text-center text-xs text-dim">
                This browser has WebGL switched off, so the 3D view can&apos;t run. Showing the side profile instead.
              </p>
            </>
          )}

          {/* edge shading behind the cards; lifts away in focus view */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-[1] hidden transition-opacity duration-500 lg:block ${focused ? "opacity-0" : "opacity-100"}`}
            style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--shade) 55%, transparent) 0, color-mix(in srgb, var(--shade) 25%, transparent) calc(var(--inset) - 30px), transparent calc(var(--inset) + 80px), transparent calc(100% - var(--inset) - 80px), color-mix(in srgb, var(--shade) 25%, transparent) calc(100% - var(--inset) + 30px), color-mix(in srgb, var(--shade) 55%, transparent) 100%)" }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-[color-mix(in_srgb,var(--shade)_70%,transparent)] to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-[color-mix(in_srgb,var(--shade)_80%,transparent)] to-transparent" />

          {/* top overlay: drag hint, or the car's title in focus view */}
          <div ref={overlayRef} className="pointer-events-none absolute inset-x-0 top-3 z-[2] flex flex-col items-center gap-2 px-3 text-center md:top-5 md:px-12">
            {focused ? (
              <div ref={titleRef} className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-semibold uppercase tracking-[.3em] text-soft">{car.maker}</p>
                <h2 className="font-display text-[clamp(40px,4.6vw,68px)] font-extrabold italic uppercase leading-[.9] tracking-[.01em] [text-shadow:0_4px_30px_var(--title-glow)]">{car.model}</h2>
                <p className="mt-1 rounded-full border border-accent/70 bg-(--float) px-4 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-accent">
                  {cl.name} · {cl.role}
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

          <NavButton dir="prev" onClick={() => step(-1)} />
          <NavButton dir="next" onClick={() => step(1)} />

          {isLg && (
            <button
              onClick={() => setFocus((f) => !f)}
              aria-pressed={focused}
              aria-label={focused ? "Show the info panels" : "Focus on the car"}
              title={focused ? "Show panels (F)" : "Focus view (F)"}
              className="absolute right-[calc(var(--inset)+16px)] top-5 z-[3] grid h-10 w-10 place-items-center rounded-full border border-edge bg-(--float) text-soft backdrop-blur-sm transition-[right,color,border-color] duration-500 hover:border-brand hover:text-ink"
            >
              <Icon name={focused ? "collapse" : "expand"} className="h-5 w-5" />
            </button>
          )}

          {focused && (
            <>
              <EdgeHandle side="left" onClick={() => setFocus(false)} />
              <EdgeHandle side="right" onClick={() => setFocus(false)} />
            </>
          )}

          {gl && (
            <div ref={toolbarRef} className="absolute bottom-5 left-1/2 z-[3] hidden -translate-x-1/2 md:block">
              <Toolbar {...toolbar} className="flex" />
            </div>
          )}
        </div>

        {/* ----- identity card ----- */}
        <section
          ref={identRef}
          aria-live="polite"
          className="glass relative z-10 col-start-1 row-start-1 flex min-w-0 flex-col overflow-hidden rounded-2xl p-3 [--gap:clamp(8px,calc(4vh_-_17px),24px)] sm:p-4 md:p-5 lg:p-4 xl:p-5 2xl:p-6"
        >
          {/* service pill, with its role beside it (the role drops below the pill if the card is too narrow) */}
          <div data-anim className="mb-(--gap) flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="rounded-md bg-accent px-2.5 py-[5px] text-[10px] font-semibold uppercase leading-none tracking-[.1em] text-(--on-accent) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors duration-300 md:text-[11px]">
              {cl.name}
            </p>
            <p className="hidden text-xs leading-none text-soft sm:block md:text-[13px]">{cl.role}</p>
          </div>
          <p data-anim className="text-sm font-medium uppercase leading-none tracking-[.1em] text-soft md:text-lg 2xl:text-[22px]">{car.maker}</p>
          <h2
            ref={modelRef}
            className="mb-(--gap) mt-1.5 font-hud text-[clamp(28px,8vw,52px)] font-semibold leading-[1.02] tracking-[-.01em] [text-wrap:balance] lg:text-[clamp(38px,3.6vw,64px)]"
          >
            {car.model}
          </h2>
          <p data-anim className="max-w-[42ch] pb-(--gap) text-[12.5px] leading-[1.55] text-soft md:text-[15px] lg:text-sm lg:leading-normal 2xl:text-base 2xl:leading-[1.6]">{car.blurb}</p>

          {/* specs: two columns under a hairline, split by a short rule (phones stack them); on a tall card they
              centre in the spare room and the service footer drops to the bottom */}
          <dl data-anim className="my-auto grid grid-cols-1 border-t border-edge sm:grid-cols-2">
            {([
              ["Body", car.body, "car"],
              ["Seats", car.seats, "users"],
              ["Power", car.power, "bolt"],
              ["Length", `${+car.p.L.toFixed(2)} m`, "ruler"],
            ] as const).map(([k, v, icon], i) => (
              <div
                key={k}
                className={`relative min-w-0 py-[clamp(9px,1.35vh,16px)] ${i ? "border-t border-edge" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 ? "sm:pl-4 sm:before:absolute sm:before:inset-y-3 sm:before:left-0 sm:before:w-px sm:before:bg-edge" : "sm:pr-3"}`}
              >
                {/* icon and label on the first line, the value on the full width under them */}
                <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase leading-none tracking-[.1em] text-dim md:text-[11px] 2xl:text-xs">
                  <Icon name={icon} className="hidden h-4 w-4 flex-none text-soft sm:block 2xl:h-[18px] 2xl:w-[18px]" />
                  {k}
                </dt>
                <dd className="mt-1.5 text-[13px] leading-snug md:text-sm 2xl:text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>

          {/* maker footer: emblem (or the maker's initial), name, and the car's place in the fleet. The slot is a little
              wider than tall so round and wide emblems look about the same size; the dark version swaps in by theme. */}
          <div data-anim className="flex items-center gap-3 border-t border-edge pt-(--gap)">
            <span className="hidden h-10 w-[52px] flex-none grid-cols-1 grid-rows-1 place-items-center sm:grid 2xl:h-[52px] 2xl:w-16">
              {logo ? (
                <>
                  {logo.dark && (
                    <Image src={logo.dark} alt="" width={64} height={52} unoptimized loading="eager" className="col-start-1 row-start-1 h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,.35)] light:hidden" />
                  )}
                  <Image
                    src={logo.src}
                    alt=""
                    width={64}
                    height={52}
                    unoptimized
                    loading="eager"
                    className={`col-start-1 row-start-1 h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,.35)] light:drop-shadow-none ${logo.dark ? "hidden light:block" : ""}`}
                  />
                </>
              ) : (
                <span className="font-display text-3xl font-bold leading-none text-soft">{car.maker[0]}</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight 2xl:text-[15px]">{car.maker}</p>
              <p className="mt-0.5 text-xs leading-snug text-soft 2xl:text-[13px]">{car.note}</p>
            </div>
          </div>
        </section>

        {/* phone: the view tools sit in their own row so they don't cover the car */}
        {gl && <Toolbar {...toolbar} className="col-span-2 row-start-2 flex justify-self-center md:hidden" />}

        {/* ----- ratings card ----- */}
        <section
          ref={ratingsRef}
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
                    <span ref={overallRef} className="text-[34px] font-semibold tabular-nums 2xl:text-[40px]">{firstOverall}</span>
                    <span className="text-sm text-dim">/10</span>
                  </p>
                  <Stars value={overall / 2} />
                </div>
              </div>
            </div>

            {/* one row per rating: label and score, then its bar; the rows spread out on a tall card */}
            <div className="mt-(--gap) grid gap-x-8 gap-y-[clamp(14px,2.4vh,26px)] border-t border-edge pt-(--gap) sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-col lg:justify-evenly">
              {STATS.map(([k, label]) => {
                const v = car.r[k];
                return (
                  <div key={k} className="flex items-center gap-3.5">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-edge bg-(--icon-bg) text-(--icon) 2xl:h-11 2xl:w-11">
                      <Icon name={STAT_ICON[k]} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2 leading-none">
                        <span className="text-[11px] font-semibold uppercase tracking-[.12em] md:text-xs">{label}</span>
                        <span className="whitespace-nowrap tabular-nums">
                          <b className="text-[15px] font-semibold">{v}</b> <span className="text-[11px] text-dim">/10</span>
                        </span>
                      </p>
                      <div aria-hidden="true" className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-(--track)">
                        <div className="h-full rounded-full bg-accent shadow-[0_0_10px_var(--accent)] transition-[width,background-color] duration-500 ease-out" style={{ width: `${v * 10}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 md:mt-0 md:self-center lg:mt-(--gap) lg:self-auto lg:border-t lg:border-edge lg:pt-(--gap)">
            <button
              aria-pressed={picked}
              onClick={togglePick}
              className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-lg font-semibold uppercase tracking-[.08em] transition-[filter,box-shadow] md:text-xl ${picked ? "bg-[linear-gradient(180deg,#ffd84a,#f5b50f)] text-[#14140f] shadow-[0_0_28px_rgba(245,197,24,.45),inset_0_1px_0_rgba(255,255,255,.5)]" : "bg-[linear-gradient(180deg,#ffd84a,#f5b50f)] text-[#14140f] shadow-[0_0_18px_rgba(245,197,24,.25),inset_0_1px_0_rgba(255,255,255,.5)] hover:brightness-110"}`}
            >
              {picked && <Icon name="check" className="h-6 w-6" strokeWidth={3} />}
              {picked ? "Selected" : "Select this car"}
              {!picked && <Icon name="arrowRight" className="h-5 w-5" strokeWidth={2.4} />}
            </button>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-dim">
              <button onClick={() => step(1)} className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 transition-colors hover:text-ink">
                <Icon name="swap" className="h-4 w-4" /> Change car
              </button>
              <span aria-hidden="true">•</span>
              <button
                onClick={() => setPick(null)}
                disabled={!pick}
                className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 transition-colors enabled:hover:text-ink disabled:opacity-50"
              >
                <Icon name="x" className="h-4 w-4" /> Clear pick
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== roster ===== */}
      <nav aria-label="Car roster" className="relative z-20 border-t border-edge bg-[linear-gradient(180deg,var(--roster-a),var(--roster-b))] px-2 py-3 md:px-gut">
        <div className="flex items-center gap-2">
          <RosterArrow dir={-1} strip={stripRef} />
          <div ref={stripRef} className="no-scrollbar relative flex min-w-0 flex-1 gap-2.5 overflow-x-auto px-1 py-2 md:gap-3">
            {CARS.map((c, i) => {
              const on = i === cur;
              const hidden = !(filter === "all" || c.cls === filter);
              return (
                <button
                  key={c.id}
                  data-i={i}
                  hidden={hidden}
                  aria-current={on || undefined}
                  aria-label={`${c.maker} ${c.model}, ${CLASSES[c.cls].name}`}
                  onClick={() => goTo(i)}
                  className={`group relative flex w-[132px] flex-none flex-col rounded-xl border p-2 text-left transition-[transform,border-color,box-shadow] duration-200 md:w-[150px] md:p-2.5 ${on ? "-translate-y-0.5 border-[#5aa6ff] bg-[linear-gradient(180deg,var(--rcard-on-a),var(--rcard-on-b))] shadow-[0_0_0_1px_#5aa6ff,0_0_24px_rgba(61,139,255,.45)]" : "border-edge bg-[linear-gradient(180deg,var(--rcard-a),var(--rcard-b))] hover:-translate-y-0.5 hover:border-[#4a86d9]"}`}
                >
                  <span className={`text-[10px] font-semibold leading-none tracking-[.12em] tabular-nums ${on ? "text-ink" : "text-dim"}`}>{pad(i + 1)}</span>
                  <span className="my-1 grid h-[58px] place-items-center md:h-[66px]">
                    {thumbs[c.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbs[c.id]} alt="" className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <SideView car={c} width={110} height={44} pad={3} className="block" />
                    )}
                  </span>
                  <span className="truncate font-display text-[15px] font-bold uppercase leading-tight tracking-[.03em] md:text-base">{c.short}</span>
                  <span className="truncate text-[9.5px] font-semibold uppercase tracking-[.14em] text-dim">{c.maker}</span>
                  {pick === c.id && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-plate px-1.5 pb-px pt-0.5 text-[8.5px] font-bold uppercase leading-none tracking-[.1em] text-[#11131a]">Selected</span>
                  )}
                </button>
              );
            })}
          </div>
          <RosterArrow dir={1} strip={stripRef} />
        </div>
      </nav>

      <footer className="relative z-20 flex flex-wrap justify-between gap-x-6 gap-y-1 bg-(--foot) px-gut py-2 text-[10.5px] leading-normal text-dim">
        <span>Group fleet: 24,500+ vehicles in 20 cities, as reported in 2025.</span>
        <span>Unofficial fan showcase, not affiliated with PT Blue Bird Tbk. The 3D models are simplified sketches, not manufacturer artwork.</span>
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

/** Five stars, gold up to `value` (0–5) over dim ones. */
function Stars({ value }: { value: number }) {
  const row = (cls: string) => (
    <span className={`flex gap-0.5 ${cls}`}>
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

/** Camera presets and display toggles in one pill. Labels only where the stage is wide enough. */
function Toolbar({ spin, zoom, onAim, onSpin, onZoomIn, onZoomOut, onZoomReset, className }: {
  spin: boolean; zoom: number; onAim: (v: ViewKey) => void; onSpin: () => void;
  onZoomIn: () => void; onZoomOut: () => void; onZoomReset: () => void; className?: string;
}) {
  const sep = <span aria-hidden="true" className="h-5 w-px bg-edge" />;
  const zoomBtn = "grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:text-ink disabled:opacity-35 disabled:hover:text-soft md:h-10 md:w-10";
  return (
    <div className={`items-center rounded-full border border-edge bg-(--float) p-1 shadow-[0_10px_30px_-10px_var(--drop)] backdrop-blur-md ${className ?? ""}`}>
      {(Object.keys(ANG) as ViewKey[]).map((v) => (
        <span key={v} className="flex items-center">
          <ToolButton icon={VIEW_ICON[v]} onClick={() => onAim(v)}>{v}</ToolButton>
          {sep}
        </span>
      ))}
      <ToolButton icon="spin" pressed={spin} onClick={onSpin}>Spin</ToolButton>
      {sep}
      <span role="group" aria-label="Zoom" className="flex items-center">
        <button onClick={onZoomOut} disabled={zoom <= ZOOM.min + 1e-3} aria-label="Zoom out" title="Zoom out (−)" className={zoomBtn}>
          <Icon name="zoomOut" className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onZoomReset}
          aria-label={`Zoom ${Math.round(zoom * 100)}%, reset to fit`}
          title="Fit (0)"
          className="hidden h-9 w-12 rounded-full text-[11px] font-semibold tabular-nums text-soft transition-colors hover:text-ink sm:block md:h-10 xl:text-xs"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={onZoomIn} disabled={zoom >= ZOOM.max - 1e-3} aria-label="Zoom in" title="Zoom in (+)" className={zoomBtn}>
          <Icon name="zoomIn" className="h-[18px] w-[18px]" />
        </button>
      </span>
    </div>
  );
}

function ToolButton({ icon, pressed, onClick, children }: { icon: IconName; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={pressed}
      onClick={onClick}
      aria-label={typeof children === "string" ? children : undefined}
      title={typeof children === "string" ? children[0].toUpperCase() + children.slice(1) : undefined}
      className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold uppercase leading-none tracking-[.1em] transition-[background,color,border-color,box-shadow] md:h-10 xl:px-4 xl:text-xs ${pressed ? "brand-fill" : "border-transparent text-soft hover:text-ink"}`}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
      <span className="hidden xl:inline">{children}</span>
    </button>
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      aria-label={dir === "prev" ? "Previous car" : "Next car"}
      onClick={onClick}
      className={`absolute bottom-4 z-[3] grid h-11 w-11 place-items-center rounded-full border border-(--float-edge) bg-(--float) text-ink shadow-[0_0_18px_rgba(61,139,255,.3)] backdrop-blur-sm transition-[background,box-shadow,left,right] duration-500 hover:bg-brand hover:shadow-[0_0_26px_rgba(61,139,255,.7)] md:bottom-5 lg:bottom-auto lg:top-1/2 lg:h-14 lg:w-14 lg:-translate-y-1/2 ${dir === "prev" ? "left-3 md:left-5 lg:left-[calc(var(--inset)+20px)]" : "right-3 md:right-5 lg:right-[calc(var(--inset)+20px)]"}`}
    >
      <Icon name={dir === "prev" ? "left" : "right"} className="h-6 w-6" strokeWidth={2.2} />
    </button>
  );
}

/** Sun in light mode, moon in dark; the two swap with a quarter turn. */
function ThemeToggle({ theme, onToggle, className }: { theme: Theme; onToggle: () => void; className?: string }) {
  const light = theme === "light";
  const icon = "absolute h-5 w-5 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.4,0,.2,1)]";
  return (
    <button
      onClick={onToggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={`relative h-10 w-10 place-items-center overflow-hidden rounded-full border border-edge bg-(--chip) text-soft transition-colors hover:border-brand hover:text-ink 2xl:h-11 2xl:w-11 ${className ?? ""}`}
    >
      <Icon name="moon" className={`${icon} rotate-0 scale-100 opacity-100 light:rotate-90 light:scale-50 light:opacity-0`} />
      <Icon name="sun" className={`${icon} -rotate-90 scale-50 text-[#f2a516] opacity-0 light:rotate-0 light:scale-100 light:opacity-100`} />
    </button>
  );
}

/** Tab on the screen edge that brings the cards back from focus view. */
function EdgeHandle({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Show the info panels"
      className={`glass absolute top-1/2 z-[3] grid h-44 w-8 -translate-y-1/2 place-items-center text-soft transition-colors hover:text-ink ${side === "left" ? "left-0 rounded-r-2xl border-l-0" : "right-0 rounded-l-2xl border-r-0"}`}
    >
      <Icon name={side === "left" ? "right" : "left"} className="h-5 w-5" />
    </button>
  );
}

function RosterArrow({ dir, strip }: { dir: 1 | -1; strip: RefObject<HTMLDivElement | null> }) {
  return (
    <button
      aria-label={dir < 0 ? "Scroll roster left" : "Scroll roster right"}
      onClick={() => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.7, behavior: "smooth" })}
      className="hidden h-20 w-8 flex-none place-items-center rounded-full border border-edge bg-(--float) text-soft transition-colors hover:border-brand hover:text-ink sm:grid"
    >
      <Icon name={dir < 0 ? "left" : "right"} className="h-5 w-5" />
    </button>
  );
}

function Menu({ focus, canFocus, spin, light, onFocus, onSpin, onTheme }: {
  focus: boolean; canFocus: boolean; spin: boolean; light: boolean;
  onFocus: () => void; onSpin: () => void; onTheme: () => void;
}) {
  const row = "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(47,139,255,.12)]";
  const sw = (on: boolean) => (
    <span className={`relative h-5 w-9 flex-none rounded-full transition-colors ${on ? "bg-brand" : "bg-(--track)"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
    </span>
  );
  return (
    <div className="glass absolute right-0 top-[calc(100%+10px)] z-40 w-72 rounded-2xl p-2">
      <button className={row} onClick={onTheme} role="menuitemcheckbox" aria-checked={light}>
        <span className="flex items-center gap-2.5"><Icon name="sun" className="h-[18px] w-[18px] text-(--icon)" /> Light mode</span>
        {sw(light)}
      </button>
      {canFocus && (
        <button className={row} onClick={onFocus} role="menuitemcheckbox" aria-checked={focus}>
          <span className="flex items-center gap-2.5"><Icon name="expand" className="h-[18px] w-[18px] text-(--icon)" /> Focus view</span>
          {sw(focus)}
        </button>
      )}
      <button className={row} onClick={onSpin} role="menuitemcheckbox" aria-checked={spin}>
        <span className="flex items-center gap-2.5"><Icon name="spin" className="h-[18px] w-[18px] text-(--icon)" /> Auto-spin</span>
        {sw(spin)}
      </button>
      <div className="mx-3 my-2 border-t border-edge" />
      <div className="px-3 pb-1 text-xs text-dim">
        <p className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-[.14em]"><Icon name="keyboard" className="h-4 w-4" /> Shortcuts</p>
        <ul className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          <Kbd>← →</Kbd><li>Change car</li>
          <Kbd>Enter</Kbd><li>Select car</li>
          {canFocus && <><Kbd>F</Kbd><li>Focus view</li></>}
          <Kbd>+ / −</Kbd><li>Zoom in / out</li>
          <Kbd>0</Kbd><li>Fit the car</li>
          <Kbd>Esc</Kbd><li>Close / exit focus</li>
        </ul>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <li className="list-none">
      <kbd className="rounded border border-edge px-1.5 py-0.5 text-[11px] font-semibold text-soft">{children}</kbd>
    </li>
  );
}
