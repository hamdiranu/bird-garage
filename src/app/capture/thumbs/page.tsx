import type { Metadata } from "next";
import ThumbnailCapture from "@/components/capture/ThumbnailCapture";

/* /capture/thumbs: a working page for scripts/capture.mjs, which saves the roster thumbnails from it. Not linked
   from the garage, and kept out of search results. */

export const metadata: Metadata = { title: "Thumbnail capture · Bird Garage", robots: { index: false, follow: false } };

export default function ThumbnailCapturePage() {
  return <ThumbnailCapture />;
}
