import { describe, expect, it } from "vitest";
import { BACKDROP, backdropAnchor, backdropStyle } from "../backdrop";

describe("backdropAnchor", () => {
  it("is the photo's own ring at its native size", () => {
    const a = backdropAnchor(BACKDROP.w, BACKDROP.h);
    expect(a.x).toBeCloseTo(BACKDROP.cx);
    expect(a.y).toBeCloseTo(BACKDROP.cy);
    expect(a.r).toBeCloseTo(BACKDROP.r);
  });

  it("scales with the photo when the box keeps its shape", () => {
    const a = backdropAnchor(BACKDROP.w / 2, BACKDROP.h / 2);
    expect(a.x).toBeCloseTo(BACKDROP.cx / 2);
    expect(a.r).toBeCloseTo(BACKDROP.r / 2);
  });

  it("covers a wide box: scaled to its width, cropped top and bottom by posY", () => {
    const W = 2000, H = 600, s = W / BACKDROP.w;
    const a = backdropAnchor(W, H);
    expect(a.r).toBeCloseTo(BACKDROP.r * s);
    expect(a.x).toBeCloseTo(BACKDROP.cx * s);
    expect(a.y).toBeCloseTo((H - BACKDROP.h * s) * BACKDROP.posY + BACKDROP.cy * s);
  });

  it("covers a tall box: scaled to its height, centred sideways", () => {
    const W = 400, H = 1116, s = H / BACKDROP.h;
    const a = backdropAnchor(W, H);
    expect(a.r).toBeCloseTo(BACKDROP.r * s);
    expect(a.x).toBeCloseTo((W - BACKDROP.w * s) * BACKDROP.posX + BACKDROP.cx * s);
  });
});

describe("backdropStyle", () => {
  it("covers the box with the theme's photo, positioned like backdropAnchor expects", () => {
    expect(backdropStyle("dark")).toEqual({ backgroundImage: "url(/showroom.jpg)", backgroundSize: "cover", backgroundPosition: "50% 60%" });
    expect(backdropStyle("light").backgroundImage).toBe("url(/showroom-day.jpg)");
  });
});
