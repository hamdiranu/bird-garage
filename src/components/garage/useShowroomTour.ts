import { useEffect, useRef, useState } from "react";

/** How long without input before the tour starts (by default), and how long each car stays on stage. */
export const DEFAULT_IDLE_MS = 60_000;
const STEP_MS = 9_000;

/** Anything that means someone is using the screen. */
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

/** Showroom mode, for a screen nobody is driving: once `enabled`, `idleMs` without input starts a tour that
    calls `advance` every few seconds, and any input hands control straight back. Returns whether it's touring. */
export function useShowroomTour(enabled: boolean, advance: () => void, idleMs = DEFAULT_IDLE_MS) {
  const [touring, setTouring] = useState(false);
  const latest = useRef(advance);
  useEffect(() => { latest.current = advance; });

  useEffect(() => {
    if (!enabled) return; // (turning it off ends a tour through the cleanup below)
    let lastInput = performance.now(), lastStep = 0, active = false;
    const wake = () => {
      lastInput = performance.now();
      if (active) { active = false; setTouring(false); }
    };
    const tick = setInterval(() => {
      const now = performance.now();
      if (now - lastInput < idleMs) return;
      // the car on stage gets its full turn before the first step
      if (!active) { active = true; lastStep = now; setTouring(true); return; }
      if (now - lastStep >= STEP_MS) { lastStep = now; latest.current(); }
    }, 1000);
    ACTIVITY.forEach((type) => window.addEventListener(type, wake, { passive: true }));
    return () => {
      clearInterval(tick);
      ACTIVITY.forEach((type) => window.removeEventListener(type, wake));
      setTouring(false);
    };
  }, [enabled, idleMs]);

  return touring;
}
