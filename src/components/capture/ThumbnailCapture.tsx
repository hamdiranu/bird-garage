"use client";

import { useEffect, useState } from "react";
import { CARS } from "@/lib/fleet";
import { THUMB_SIZE } from "@/lib/assets";

/** Renders every car's thumbnail (or those in ?ids=a,b) and shows them in a grid, marking the page data-ready
    when done. scripts/capture.mjs saves each image to public/thumbs/<id>.webp. Rendered at twice the size they're
    shown at, for sharp screens. */
export default function ThumbnailCapture() {
  const [shots, setShots] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const ids = new URLSearchParams(location.search).get("ids")?.split(",");
    const cars = ids ? CARS.filter((c) => ids.includes(c.id)) : CARS;
    import("@/lib/models/thumbnails")
      .then((m) => m.renderThumbnails(cars, { width: THUMB_SIZE.width * 2, height: THUMB_SIZE.height * 2, type: "image/webp", quality: 0.9 }))
      .then(setShots);
  }, []);

  return (
    <main data-ready={shots ? "" : undefined} className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 p-6">
      {shots
        ? Object.entries(shots).map(([id, url]) => (
            <figure key={id} className="rounded-xl border border-edge p-2 text-xs text-dim">
              {/* a data URL rendered in the browser, so next/image has nothing to optimise */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-id={id} src={url} alt={id} className="w-full" />
              <figcaption>{id}</figcaption>
            </figure>
          ))
        : <p className="text-sm text-dim">Rendering…</p>}
    </main>
  );
}
