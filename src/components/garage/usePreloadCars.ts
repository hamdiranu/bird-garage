import { useEffect } from "react";
import { CARS } from "@/lib/fleet";

/** Wait for the car on stage to settle (its roll-in) before fetching the next ones. */
const DELAY_MS = 900;

/** Fetch and build these cars' models in the background (the ones either side of the car on stage), so stepping
    to them is instant. Models are cached, so asking again costs nothing. */
export function usePreloadCars(indexes: number[], enabled: boolean) {
  const key = indexes.join();
  useEffect(() => {
    if (!enabled || !key) return;
    const t = setTimeout(() => {
      import("@/lib/models/loadCar").then((m) => {
        key.split(",").forEach((i) => m.loadCar(CARS[Number(i)]).catch(() => {}));
      });
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [key, enabled]);
}
