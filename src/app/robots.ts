import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/previews";

/* /robots.txt. Everything is open to crawlers except the thumbnail-capture working page, and the sitemap is
   named so a crawler that finds the site on its own still learns every car page. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/capture/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
