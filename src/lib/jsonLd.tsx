import type { Car } from "@/types/fleet";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "./previews";

/* Structured data (JSON-LD) for the server-rendered pages. Two things earn their keep here: a WebSite on the home
   page, which is how Google decides what to call the site in a result rather than guessing from the domain, and a
   breadcrumb trail on each car page, which a result can show in place of the bare URL. */

const AUTHOR = { "@type": "Person", name: "Hamdi Ranuharja" } as const;

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: ["en", "id"],
    author: AUTHOR,
    creator: AUTHOR,
  };
}

/** Bird Garage → <car>, for the car pages. */
export function carJsonLd(car: Car) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: `${car.maker} ${car.model}` },
    ],
  };
}

/** The tag that carries one of the above. Every < is written as its JSON escape, so no value — a car's blurb, say —
    can close the script early; whatever reads the data decodes it back. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
