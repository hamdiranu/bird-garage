import Link from "next/link";
import { CARS } from "@/lib/fleet";
import { carPath } from "@/lib/share";

/* Plain links to the garage and to every car's page. The roster is buttons that swap the car on stage without
   leaving the page, the header wordmark goes nowhere, and the share link is built in the browser — so a crawler
   reading the HTML would otherwise find no way between the garage and /car/<id>. For the same reason this is also
   the only place a screen reader can reach the permalinks, so it is off-screen rather than hidden outright.
   Nothing is prefetched: these are a way out of the page, not somewhere a visitor is likely headed. */

/** `except` is the car whose page this is: it leaves that car out and links back to the garage instead. */
export function CarLinks({ except }: { except?: string }) {
  return (
    <nav className="sr-only" aria-label="Every car in the fleet">
      <ul>
        {except && (
          <li>
            <Link href="/" prefetch={false}>Bird Garage</Link>
          </li>
        )}
        {CARS.filter((car) => car.id !== except).map((car) => (
          <li key={car.id}>
            <Link href={carPath(car.id)} prefetch={false}>{`${car.maker} ${car.model}`}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
