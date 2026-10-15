import { useEffect, useState } from "react";
import { CARS } from "@/lib/fleet";

/** Give the main scene a head start before the roster's models load. */
const DELAY_MS = 700;

/** Pictures of every car's 3D model for the roster, keyed by car id; empty until they're ready, and without
    WebGL. Rendered once, off screen. */
export function useCarThumbnails(enabled: boolean | null) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const t = setTimeout(() => {
      import("@/lib/models/thumbnails")
        .then((m) => m.renderThumbnails(CARS))
        .then((out) => { if (live) setThumbs(out); })
        .catch(() => {});
    }, DELAY_MS);
    return () => { live = false; clearTimeout(t); };
  }, [enabled]);
  return thumbs;
}
