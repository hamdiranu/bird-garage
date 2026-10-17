import { describe, expect, it } from "vitest";
import { VIEWS, ZOOM, clampZoom, shortestTurn } from "../view";

describe("shortestTurn", () => {
  it("is zero when already there", () => {
    expect(shortestTurn(VIEWS.side, VIEWS.side)).toBeCloseTo(0);
  });

  it("goes the short way round", () => {
    expect(shortestTurn(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(shortestTurn(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
  });

  it("ignores how many full turns the car has already made", () => {
    expect(shortestTurn(10 * Math.PI + 0.2, 0)).toBeCloseTo(-0.2);
    expect(shortestTurn(-7 * 2 * Math.PI, VIEWS.rear)).toBeCloseTo(Math.PI / 2);
  });

  it("always lands in [-π, π)", () => {
    for (let yaw = -20; yaw <= 20; yaw += 0.37) {
      const turn = shortestTurn(yaw, VIEWS.front);
      expect(turn).toBeGreaterThanOrEqual(-Math.PI);
      expect(turn).toBeLessThan(Math.PI);
    }
  });
});

describe("clampZoom", () => {
  it("keeps zoom between its limits", () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(0.1)).toBe(ZOOM.min);
    expect(clampZoom(9)).toBe(ZOOM.max);
  });
});
