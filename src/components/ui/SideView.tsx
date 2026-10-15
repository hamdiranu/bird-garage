"use client";

import { useEffect, useRef } from "react";
import { drawSideView } from "@/lib/sideView";
import type { Car } from "@/types/fleet";

/** A car's 2D side profile on a canvas: the roster placeholder and the no-WebGL stage. */
export default function SideView({ car, width, height, pad, className }: {
  car: Car; width: number; height: number; pad: number; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawSideView(ref.current, car, width, height, pad);
  }, [car, width, height, pad]);
  return <canvas ref={ref} aria-hidden="true" className={className} style={{ width, height }} />;
}
