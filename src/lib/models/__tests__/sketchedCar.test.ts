import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { withFakeCanvas } from "@/testing/canvas";
import { CARS } from "@/lib/fleet";
import { buildSketchedCar } from "../sketchedCar";

describe("buildSketchedCar", () => {
  it.each(CARS.map((c) => [c.id, c] as const))("builds %s at its real size, with turnable wheels", (_, car) => {
    withFakeCanvas();
    const built = buildSketchedCar(car);
    const box = new THREE.Box3().setFromObject(built.root);
    const size = box.getSize(new THREE.Vector3());
    const { L, W, H } = car.profile;
    expect(size.x).toBeCloseTo(L, 0);
    expect(size.z).toBeLessThan(W * 1.25);
    expect(box.min.y).toBeGreaterThanOrEqual(-0.01);
    // its listed height is the top of the body; signs and rails can stand a little higher
    expect(built.height).toBeGreaterThanOrEqual(H * 0.95);
    expect(built.height).toBeLessThan(H + 0.4);
    expect(built.wheels.length).toBeGreaterThanOrEqual(4);
  });

  it("builds each car once and reuses it", () => {
    withFakeCanvas();
    expect(buildSketchedCar(CARS[0])).toBe(buildSketchedCar(CARS[0]));
  });
});
