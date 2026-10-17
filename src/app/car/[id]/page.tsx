import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Garage from "@/components/garage/Garage";
import { I18nProvider } from "@/i18n/I18nProvider";
import { CARS } from "@/lib/fleet";
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
  if (!CARS.some((c) => c.id === id)) notFound();
  return (
    <I18nProvider>
      <Garage initialCar={id} />
    </I18nProvider>
  );
}
