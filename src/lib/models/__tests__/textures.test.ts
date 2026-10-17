import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { withFakeCanvas } from "@/testing/canvas";
import { glowTexture } from "../textures";

describe("glowTexture", () => {
  it("paints a radial fade from the inner colour to clear, as an sRGB texture", () => {
    const made = withFakeCanvas();
    const t = glowTexture("white", "grey");
    const c = made[0];
    expect(t).toBeInstanceOf(THREE.CanvasTexture);
    expect(t.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(c.createRadialGradient).toHaveBeenCalledWith(64, 64, 0, 64, 64, 64);
    expect(c.gradient.addColorStop.mock.calls).toEqual([[0, "white"], [0.35, "grey"], [1, "rgba(0,0,0,0)"]]);
    expect(c.fillRect).toHaveBeenCalledWith(0, 0, 128, 128);
  });
});
