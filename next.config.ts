import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** Folders in public/ whose files are requested with a content hash (?v=…, see src/lib/assets.ts), so they can be
    cached for a year: a changed file gets a new URL. */
const VERSIONED = ["models", "thumbs"];

/** Content hash of every file in those folders, keyed by URL path, e.g. { "/thumbs/limo.webp": "1a2b3c4d" }. */
function assetVersions() {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else out["/" + path.relative("public", file).split(path.sep).join("/")] = createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 10);
    }
  };
  for (const dir of VERSIONED) {
    try { walk(path.join("public", dir)); } catch {}
  }
  return out;
}

const YEAR = "public, max-age=31536000, immutable";
/** For the other images and the texture transcoder: a week, then checked again (304 if unchanged). */
const WEEK = "public, max-age=604800, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  env: { ASSET_VERSIONS: JSON.stringify(assetVersions()) },
  async headers() {
    // In development files change under the server, so they keep Next's default (always revalidate).
    if (process.env.NODE_ENV !== "production") return [];
    return [
      ...VERSIONED.map((dir) => ({ source: `/${dir}/:path*`, headers: [{ key: "Cache-Control", value: YEAR }] })),
      ...["/basis/:path*", "/icons/:path*", "/logos/:path*", "/previews/:path*", "/showroom.jpg", "/showroom-day.jpg"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: WEEK }],
      })),
    ];
  },
};

export default nextConfig;
