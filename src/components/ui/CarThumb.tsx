"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { THUMB_SIZE, thumbPath } from "@/lib/assets";
import type { Car } from "@/types/fleet";
import SideView from "./SideView";

interface CarThumbProps {
  car: Car;
  /** Size of the 2D drawing that stands in when there's no picture. */
  sketch: { width: number; height: number };
  className?: string;
}

/** A car's picture: the pre-rendered image of its 3D model (public/thumbs), or its 2D side view if that file is
    missing. Off-screen pictures load lazily. */
export function CarThumb({ car, sketch, className }: CarThumbProps) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A load that failed before hydration fired its error event before React was listening.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) return <SideView car={car} width={sketch.width} height={sketch.height} pad={3} className="block" />;
  return (
    <Image
      ref={ref}
      src={thumbPath(car.id)}
      alt=""
      width={THUMB_SIZE.width}
      height={THUMB_SIZE.height}
      unoptimized
      onError={() => setMissing(true)}
      className={className}
    />
  );
}
