import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { Car } from "@/types/fleet";
import { localize } from "./language";

/* Link previews (Open Graph and X cards) for the server-rendered pages. Each car's picture is a screenshot of it
   on the showroom platform, made by scripts/capture.mjs into public/previews; a car without one yet
   shares without a picture rather than with a broken one. Server only: it checks the files on disk. */

export const PREVIEW_SIZE = { width: 1200, height: 630 };

/** The site's address for absolute preview URLs: SITE_URL when set (e.g. https://bird-garage.example), otherwise
    Next's own fallback (the Vercel production URL, or localhost in development). */
export const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;

function previewImage(car: Car) {
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
    openGraph: { title, description, url, siteName: "Bird Garage", type: "website", locale: "en_US", images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image.url] : undefined },
  };
}
