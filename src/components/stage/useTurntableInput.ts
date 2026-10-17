import { useEffect, useRef, type PointerEvent } from "react";
import gsap from "gsap";
import type { Rig } from "./types";

/** Drag sideways to turn the car, pinch or scroll to zoom. Returns the element ref and its pointer handlers. */
export function useTurntableInput(rig: Rig, onZoom: (factor: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const lastX = useRef(0);
  /** Fingers/pointers currently down on the stage, for pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** Finger spread at the last pinch step; 0 when not pinching. */
  const pinch = useRef(0);
  const zoom = useRef(onZoom);
  zoom.current = onZoom;

  // Wheel zooms. React's wheel listener is passive (can't stop the page scrolling), so attach our own.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1); // lines/pages → pixels
      zoom.current(Math.exp(-dy * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const release = (id: number) => {
    if (!pointers.current.delete(id)) return;
    if (pointers.current.size < 2) pinch.current = 0;
    const [rest] = [...pointers.current.values()];
    if (rest) { lastX.current = rest.x; return; } // one finger left after a pinch: carry on turning
    rig.dragging = false;
    ref.current?.removeAttribute("data-drag");
    rig.lastInput = performance.now();
    rig.wake();
  };

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      if (pointers.current.size === 2) { pinch.current = spread(); return; }
      rig.dragging = true;
      gsap.killTweensOf(rig, "yaw");
      ref.current?.setAttribute("data-drag", "true");
      lastX.current = e.clientX;
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const pt = pointers.current.get(e.pointerId);
      if (!pt) return;
      pt.x = e.clientX;
      pt.y = e.clientY;
      if (pointers.current.size >= 2) {
        const d = spread();
        if (pinch.current > 0 && d > 0) zoom.current(d / pinch.current);
        pinch.current = d;
        return;
      }
      if (!rig.dragging) return;
      // Turn only: the camera's height is fixed to match the photo behind.
      rig.yaw += (e.clientX - lastX.current) * 0.009;
      lastX.current = e.clientX;
      rig.lastInput = performance.now();
      rig.wake();
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => release(e.pointerId),
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => release(e.pointerId),
    onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) => release(e.pointerId),
  };

  return { ref, handlers };
}
