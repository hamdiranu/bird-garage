import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { Car } from "@/types/fleet";
import { CARS } from "./fleet";
import { localize } from "./language";

/* Link previews (Open Graph and X cards) for the server-rendered pages. Each car's picture is a screenshot of it
   on the showroom platform, made by scripts/capture.mjs into public/previews; a car without one yet
   shares without a picture rather than with a broken one. Server only: it checks the files on disk. */

export const PREVIEW_SIZE = { width: 1200, height: 630 };

export const SITE_NAME = "Bird Garage";

export const SITE_TITLE = "Bird Garage · The Bluebird Group fleet in 3D";

/** What a search result prints under the title, so it names what someone would search for — the group, taxis, 3D —
    rather than describing the screen, and counts the fleet itself so it stays true as cars are added. */
export const SITE_DESCRIPTION = `Spin, compare and inspect ${CARS.length} cars of Indonesia's Bluebird Group taxi fleet as 3D models, from the 1972 Holden Torana to the electric BYD e6 Prime. Unofficial fan showcase.`;

/** Where the site is published, used when nothing in the build says otherwise. */
const PUBLISHED_AT = "https://bird-garage.netlify.app";

/** The site's address, as the host that built it gives it: SITE_URL when set by hand, else Netlify's URL, else
    Vercel's production domain, else where it is published. Absolute either way, so a preview picture, a canonical
    link or a sitemap entry never points at localhost — which is what they did when this was left unset. */
export const siteUrl = new URL(
  process.env.SITE_URL
    || process.env.URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || PUBLISHED_AT,
);

/** A path on this site as a full URL, e.g. "/car/limo" → "https://bird-garage.netlify.app/car/limo". */
export const absoluteUrl = (path: string) => new URL(path, siteUrl).href;

/** A car's preview picture, if it has been captured yet. */
export function previewImage(car: Car) {
  const file = `/previews/${car.id}.jpg`;
  if (!existsSync(path.join(process.cwd(), "public", file))) return undefined;
  return { url: file, ...PREVIEW_SIZE, alt: `${car.maker} ${car.model} on the Bird Garage showroom platform` };
}

/** Title, description and preview card for a page that opens on `car` (the car's name and blurb unless given). */
export function carMetadata(car: Car, url: string, text: { title?: string; description?: string } = {}): Metadata {
  const title = text.title ?? `${car.maker} ${car.model} · Bird Garage`;
  const description = text.description ?? localize(car.blurb, "en");
  const image = previewImage(car);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website", locale: "en_US", images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image.url] : undefined },
  };
}
