import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Garage from "@/components/garage/Garage";
import { CarLinks } from "@/components/ui/CarLinks";
import { I18nProvider } from "@/i18n/I18nProvider";
import { CARS } from "@/lib/fleet";
import { JsonLd, carJsonLd } from "@/lib/jsonLd";
import { carMetadata } from "@/lib/previews";
import { carPath } from "@/lib/share";

/* /car/<id>: the garage opened on one car, with that car's link preview. This is the link the share button
   copies. Every car's page is built ahead of time; any other id is a 404. */

export const dynamicParams = false;

export function generateStaticParams() {
  return CARS.map((car) => ({ id: car.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const car = CARS.find((c) => c.id === id);
  return car ? carMetadata(car, carPath(car.id)) : {};
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = CARS.find((c) => c.id === id);
  if (!car) notFound();
  return (
    <I18nProvider>
      {/* Names this page by its car, so a search result for it reads as being about that car and not about the
          garage as a whole. The service is left to the card, which names it either way. See the home page. */}
      <h1 className="sr-only">{`${car.maker} ${car.model} in 3D — Bluebird Group fleet`}</h1>
      <Garage initialCar={id} />
      <CarLinks except={car.id} />
      <JsonLd data={carJsonLd(car)} />
    </I18nProvider>
  );
}
