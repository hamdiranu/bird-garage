import { CarLinks } from "@/components/ui/CarLinks";
import Garage from "@/components/garage/Garage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { JsonLd, siteJsonLd } from "@/lib/jsonLd";

export default function Home() {
  return (
    <I18nProvider>
      {/* The garage heads its info card with the name of the car on stage; this names the page itself, which the
          3D app never does, and is what a search result and a screen reader read first. Off-screen so the
          wordmark in the header stays the thing you see. */}
      <h1 className="sr-only">Bird Garage — the Bluebird Group fleet in 3D</h1>
      <Garage />
      <CarLinks />
      <JsonLd data={siteJsonLd()} />
    </I18nProvider>
  );
}
