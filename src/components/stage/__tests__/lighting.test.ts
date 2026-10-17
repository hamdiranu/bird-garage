import gsap from "gsap";
import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { LOOK, THEME_SECONDS, tweenColor } from "../lighting";

afterEach(() => { gsap.globalTimeline.clear(); });

describe("LOOK", () => {
  it("has the same lights for night and day", () => {
    expect(Object.keys(LOOK.light).sort()).toEqual(Object.keys(LOOK.dark).sort());
  });

  it("lights the day brighter than the night", () => {
    expect(LOOK.light.hemi).toBeGreaterThan(LOOK.dark.hemi);
    expect(LOOK.light.exposure).toBeGreaterThan(LOOK.dark.exposure);
  });

  it("relights in step with the page's theme fade", () => {
    expect(THEME_SECONDS).toBe(0.7);
  });
});

describe("tweenColor", () => {
  it("eases a colour to the target", () => {
    const c = new THREE.Color("#000000");
    tweenColor(c, "#ff0000", 1, 0, 1);
    gsap.globalTimeline.progress(1);
    gsap.getTweensOf(c).forEach((t) => t.progress(1));
    expect(c.getHexString()).toBe("ff0000");
  });

  it("scales and lightens the target toward white", () => {
    const c = new THREE.Color("#000000");
    tweenColor(c, "#ff0000", 0.5, 0.5, 1);
    gsap.getTweensOf(c).forEach((t) => t.progress(1));
    const expected = new THREE.Color("#ff0000").multiplyScalar(0.5).lerp(new THREE.Color(1, 1, 1), 0.5);
    expect(c.r).toBeCloseTo(expected.r);
    expect(c.g).toBeCloseTo(expected.g);
  });

  it("replaces a tween already running on the same colour", () => {
    const c = new THREE.Color("#000000");
    tweenColor(c, "#ff0000", 1, 0, 1);
    tweenColor(c, "#0000ff", 1, 0, 1);
    expect(gsap.getTweensOf(c)).toHaveLength(1);
    gsap.getTweensOf(c)[0].progress(1);
    expect(c.getHexString()).toBe("0000ff");
  });
});
