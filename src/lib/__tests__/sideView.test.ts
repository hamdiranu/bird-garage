import { describe, expect, it, vi } from "vitest";
import { withFakeCanvas } from "@/testing/canvas";
import { CARS } from "../fleet";
import { drawSideView } from "../sideView";

describe("drawSideView", () => {
  it("sizes the canvas for the screen's pixel ratio, capped at 2", () => {
    withFakeCanvas();
    vi.stubGlobal("devicePixelRatio", 3);
    const cv = document.createElement("canvas");
    drawSideView(cv, CARS[0], 110, 44, 3);
    expect([cv.width, cv.height]).toEqual([220, 88]);
  });

  it.each(CARS.map((c) => [c.id, c] as const))("draws %s: body, windows and two wheels", (_, car) => {
    const made = withFakeCanvas();
    drawSideView(document.createElement("canvas"), car, 200, 80, 4);
    const c = made[0];
    expect(c.clearRect).toHaveBeenCalled();
    expect(vi.mocked(c.fill).mock.calls.length).toBeGreaterThan(3);
    expect(vi.mocked(c.arc).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("does nothing without a 2D context", () => {
    const cv = document.createElement("canvas");
    expect(() => drawSideView(cv, CARS[0], 110, 44, 3)).not.toThrow();
  });
});
