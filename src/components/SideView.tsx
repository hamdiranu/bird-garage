"use client";

import { useEffect, useRef } from "react";
import { drawSide, type Car } from "@/lib/fleet";

/** 2D side profile drawn to a canvas: roster thumbnails and the no-WebGL fallback. */
export default function SideView({ car, width, height, pad, className }: {
  car: Car; width: number; height: number; pad: number; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawSide(ref.current, car, width, height, pad);
  }, [car, width, height, pad]);
  return <canvas ref={ref} aria-hidden="true" className={className} style={{ width, height }} />;
}
