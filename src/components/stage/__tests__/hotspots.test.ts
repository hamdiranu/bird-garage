import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { CARS } from "@/lib/fleet";
import type { Hotspot } from "@/types/fleet";
import { facing, hotspotNormal, hotspotPoint } from "../hotspots";

const car = CARS.find((c) => c.id === "limo")!;
const { L, H, W } = car.profile;
const spot = (at: Hotspot["at"]): Hotspot => ({ kind: "sign", at });

describe("hotspotPoint", () => {
  it("puts along = 0 at the front bumper (+x) and 1 at the rear", () => {
    expect(hotspotPoint(car, spot([0, 0, 0])).x).toBeCloseTo(L / 2);
    expect(hotspotPoint(car, spot([1, 0, 0])).x).toBeCloseTo(-L / 2);
  });

  it("measures height as a share of the roof", () => {
    expect(hotspotPoint(car, spot([0.5, 1.1, 0])).y).toBeCloseTo(1.1 * H);
  });

  it("puts the car's right side (from the driver's seat) at -z", () => {
    expect(hotspotPoint(car, spot([0.5, 0.5, 1])).z).toBeCloseTo(-W / 2);
    expect(hotspotPoint(car, spot([0.5, 0.5, -1])).z).toBeCloseTo(W / 2);
  });

  it("writes into the vector it's given", () => {
    const out = new THREE.Vector3();
    expect(hotspotPoint(car, spot([0.5, 0.5, 0]), out)).toBe(out);
  });
});

describe("hotspotNormal", () => {
  const dir = (at: Hotspot["at"]) => hotspotNormal(spot(at));

  it("faces forward at the nose, back at the tail", () => {
    expect(dir([0, 0.3, 0]).x).toBeCloseTo(1);
    expect(dir([1, 0.3, 0]).x).toBeCloseTo(-1);
  });

  it("faces up on the roof", () => {
    expect(dir([0.5, 1.1, 0]).y).toBeCloseTo(1);
  });

  it("faces out of the side it's on", () => {
    expect(dir([0.5, 0.45, 1]).z).toBeCloseTo(-1);
    expect(dir([0.5, 0.45, -1]).z).toBeCloseTo(1);
  });

  it("leans both ways at a corner", () => {
    const n = dir([0.97, 0.56, -0.85]);
    expect(n.x).toBeLessThan(0);
    expect(n.z).toBeGreaterThan(0);
    expect(n.length()).toBeCloseTo(1);
  });
});

describe("facing", () => {
  const camera = new THREE.Vector3(0, 2, 10); // in front of the +z side
  const origin = new THREE.Vector3();

  it("is 1 for a side that faces the camera, and negative for the far side", () => {
    expect(facing(new THREE.Vector3(0, 0, 1), origin, camera)).toBeCloseTo(1);
    expect(facing(new THREE.Vector3(0, 0, -1), origin, camera)).toBeCloseTo(-1);
  });

  it("is about 0 side-on", () => {
    expect(facing(new THREE.Vector3(1, 0, 0), origin, camera)).toBeCloseTo(0);
  });

  it("counts the top of the car as facing from anywhere", () => {
    expect(facing(new THREE.Vector3(0, 1, 0), origin, camera)).toBeCloseTo(1);
    expect(facing(new THREE.Vector3(0, 1, 0), origin, new THREE.Vector3(0, 2, -10))).toBeCloseTo(1);
  });
});
