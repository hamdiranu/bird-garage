import type { Theme } from "./theme";

/* The showroom photo behind the stage, and where its glowing platform lands on screen.
   Measurements are in the photo's own pixels. */
export const BACKDROP = {
  /** Night (dark theme) and day (light theme) shots of the same room, framed identically. */
  src: { dark: "/showroom.jpg", light: "/showroom-day.jpg" },
  w: 2000,
  h: 1116,
  /** Centre and horizontal radius of the platform's glowing ring. */
  cx: 994,
  cy: 785,
  r: 592,
  /** CSS background-position, as fractions. */
  posX: 0.5,
  posY: 0.6,
  /** Camera elevation that matches the photo: the ring is 90px tall for 592px wide, asin(90/592). */
  el: 0.153,
};

/** Where the platform centre and ring radius fall in a box of W×H showing the photo with `cover`. */
export function backdropAnchor(W: number, H: number) {
  const b = BACKDROP, s = Math.max(W / b.w, H / b.h);
  const ox = (W - b.w * s) * b.posX, oy = (H - b.h * s) * b.posY;
  return { x: ox + b.cx * s, y: oy + b.cy * s, r: b.r * s };
}

/** CSS for one theme's photo, filling its box like the stage expects (see backdropAnchor). */
export const backdropStyle = (theme: Theme) => ({
  backgroundImage: `url(${BACKDROP.src[theme]})`,
  backgroundSize: "cover",
  backgroundPosition: `${BACKDROP.posX * 100}% ${BACKDROP.posY * 100}%`,
});
