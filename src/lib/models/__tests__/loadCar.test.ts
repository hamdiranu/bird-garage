import { describe, expect, it, vi } from "vitest";
import { CARS } from "@/lib/fleet";
import type { Car } from "@/types/fleet";

const loadScannedCar = vi.fn((car: Car) => Promise.resolve({ root: {}, wheels: [], height: 1, from: `scan:${car.id}` }));
const buildSketchedCar = vi.fn((car: Car) => ({ root: {}, wheels: [], height: 1, from: `sketch:${car.id}` }));
vi.mock("../scannedCar", () => ({ loadScannedCar }));
vi.mock("../sketchedCar", () => ({ buildSketchedCar }));
const { loadCar } = await import("../loadCar");

describe("loadCar", () => {
  it("loads a car's scan when it has one", async () => {
    const car = CARS.find((c) => c.scan)!;
    await expect(loadCar(car)).resolves.toMatchObject({ from: `scan:${car.id}` });
    expect(buildSketchedCar).not.toHaveBeenCalled();
  });

  it("sketches a car without a scan", async () => {
    const car = { ...CARS[0], scan: undefined };
    await expect(loadCar(car)).resolves.toMatchObject({ from: `sketch:${car.id}` });
  });
});
