import * as THREE from "three";
import gsap from "gsap";

/** Lighting to match each backdrop: warm downlights and neon fill at night, bright neutral daylight by day.
    Intensities are in units of π (three's physical light scale). */
export const LOOK = {
  dark: { sky: "#8fb0ff", ground: "#070d1f", hemi: 0.4, key: 1.05, keyColor: "#ffe6c4", fill: 0.55, fillColor: "#5d9bff", rim: 1.1, exposure: 0.95 },
  light: { sky: "#eef4ff", ground: "#8a99b0", hemi: 0.95, key: 1.55, keyColor: "#ffffff", fill: 0.45, fillColor: "#d4e4ff", rim: 0.6, exposure: 1.05 },
} as const;

/** Matches the CSS theme transition, so the car relights while the page and photo change. */
export const THEME_SECONDS = 0.7;

/** Tween a colour toward a hex value, optionally scaled and lightened toward white. */
export function tweenColor(target: THREE.Color, hex: string, scale = 1, lerpWhite = 0, duration = 0.6) {
  const to = new THREE.Color(hex).multiplyScalar(scale).lerp(new THREE.Color(1, 1, 1), lerpWhite);
  gsap.to(target, { r: to.r, g: to.g, b: to.b, duration, ease: "power2.inOut", overwrite: true });
}
