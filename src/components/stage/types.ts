import type { RefObject } from "react";
import type { Theme } from "@/lib/theme";
import type { Car, Hotspot } from "@/types/fleet";

/* Types shared by the 3D stage and the page around it. They live apart from Stage.tsx so the page can use them
   without pulling the 3D code into its bundle. */

/** Mutable turntable state shared between the page and the render loop. */
export interface Rig {
  /** Turntable angle in radians. */
  yaw: number;
  /** Auto-spin is on. */
  spin: boolean;
  /** A pointer is turning the car. */
  dragging: boolean;
  /** Something wants the car to hold still (a hotspot's note is open). */
  hold: boolean;
  /** When the visitor last turned it (performance.now()); auto-spin waits a moment after that. */
  lastInput: number;
  /** 0–1 flash of the floor glow when a car is picked. */
  pulse: number;
  /** The stage draws only while something moves. Call this after changing the rig from outside the render loop
      (a drag, a GSAP tween, a switch) so it draws again; the stage sets it once it mounts. */
  wake: () => void;
  /** The stage is scrolled out of view, so it stops drawing (even while spinning). */
  offscreen: boolean;
}

/** Pixels of the canvas covered by page UI on each edge; the car is framed clear of them. */
export interface Frame {
  side: number;
  top: number;
  bottom: number;
  /** Extra room to leave beside the car, e.g. for prev/next buttons at mid-height. */
  gutter: number;
}

/** The page's hotspot buttons, which the render loop keeps over their points on the car. */
export interface HotspotDots {
  /** The current car's hotspots. */
  list: Hotspot[];
  /** One button per hotspot, in the same order. The loop moves each one and sets its --facing (0–1, how far it
      faces the camera) and data-hidden (when it's round the back). */
  els: RefObject<(HTMLElement | null)[]>;
}

export interface StageProps {
  car: Car;
  /** Compare mode: the other car, standing to the left of `car`. */
  pinned: Car | null;
  /** Accessible description of the view, in the visitor's language. */
  label: string;
  /** The current car's service colour, for the rim light. */
  accent: string;
  /** Bumped when the car should roll in rather than appear in place. */
  rollKey: number;
  rig: Rig;
  reduceMotion: boolean;
  frame: Frame;
  theme: Theme;
  /** Magnification over the fitted view (1 = fit). Below 1 only the car shrinks; the photo can't, or its edges would show. */
  zoom: number;
  /** Ask the page to multiply the zoom (wheel and pinch on the stage). */
  onZoom: (factor: number) => void;
  /** The backdrop photo's layer, scaled with the zoom so the car stays standing on its platform. */
  backdrop: RefObject<HTMLDivElement | null>;
  /** Hotspots to track on the current car, or null to show none. */
  hotspots: HotspotDots | null;
  /** Called whenever every car on the stage is showing (the preview capture waits for it). */
  onReady?: () => void;
}
