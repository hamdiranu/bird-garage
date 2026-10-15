import type { Car } from "@/types/fleet";
import { buildSketchedCar } from "./sketchedCar";
import type { BuiltCar } from "./types";

/** A car's 3D model: its scan when it has one, otherwise the sketch. The scan loader is imported on demand, so
    the GLTF code only downloads once a scanned car is shown. Both are cached per car. */
export function loadCar(car: Car): Promise<BuiltCar> {
  if (!car.scan) return Promise.resolve(buildSketchedCar(car));
  return import("./scannedCar").then((m) => m.loadScannedCar(car));
}
