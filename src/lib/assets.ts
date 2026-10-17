/* URLs of the files in public/ that change when their car does. Car models and thumbnails are requested with a
   hash of their content (worked out in next.config.ts when the site starts or builds), so the server can let
   browsers cache them for a year: a re-captured thumbnail or replaced model simply gets a new URL. */

const VERSIONS: Record<string, string> = JSON.parse(process.env.ASSET_VERSIONS || "{}");

/** The path with its content hash added, e.g. "/thumbs/limo.webp?v=1a2b3c4d" (unchanged if the file is unknown). */
export function assetUrl(path: string) {
  const v = VERSIONS[path];
  return v ? `${path}?v=${v}` : path;
}

/** A thumbnail's display size in CSS pixels (the files are twice this, for sharp screens). */
export const THUMB_SIZE = { width: 260, height: 130 };

/** The pre-rendered picture of a car's 3D model (scripts/capture.mjs). */
export const thumbPath = (id: string) => assetUrl(`/thumbs/${id}.webp`);
