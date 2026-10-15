import type { RefObject } from "react";
import type { Theme } from "@/lib/theme";
import type { Car } from "@/types/fleet";

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
  /** When the visitor last turned it (performance.now()); auto-spin waits a moment after that. */
  lastInput: number;
  /** 0–1 flash of the floor glow when a car is picked. */
  pulse: number;
}

/** Pixels of the canvas covered by page UI on each edge; the car is framed clear of them. */
export interface Frame {
  side: number;
  top: number;
  bottom: number;
  /** Extra room to leave beside the car, e.g. for prev/next buttons at mid-height. */
  gutter: number;
}

export interface StageProps {
  car: Car;
  /** Accessible description of the view, in the visitor's language. */
  label: string;
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
}
