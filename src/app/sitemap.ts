import type { MetadataRoute } from "next";
import { CARS } from "@/lib/fleet";
import { absoluteUrl, previewImage } from "@/lib/previews";
import { carPath } from "@/lib/share";

/* /sitemap.xml: the garage and one entry per car. Nothing on the page links to /car/<id> with an <a> — the roster
   is buttons, and the share button builds the link in the browser — so this is how a search engine finds them.
   Each entry carries the car's preview picture, which is what Google Images has to go on. */

export default function sitemap(): MetadataRoute.Sitemap {
  const home = {
    url: absoluteUrl("/"),
    changeFrequency: "monthly" as const,
    priority: 1,
  };
  return [
    home,
    ...CARS.map((car) => {
      const image = previewImage(car);
      return {
        url: absoluteUrl(carPath(car.id)),
        changeFrequency: "monthly" as const,
        priority: 0.8,
        images: image ? [absoluteUrl(image.url)] : undefined,
      };
    }),
  ];
}
