import { describe, expect, it, vi } from "vitest";
import { hasWebGL, scrollToCentre } from "../dom";

describe("hasWebGL", () => {
  it("is false when no WebGL context can be made", () => {
    expect(hasWebGL()).toBe(false);
  });

  it("is true when WebGL 2 or 1 is available", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(((type: string) => (type === "webgl" ? {} : null)) as never);
    expect(hasWebGL()).toBe(true);
  });

  it("is false if asking throws", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(() => { throw new Error("blocked"); });
    expect(hasWebGL()).toBe(false);
  });
});

describe("scrollToCentre", () => {
  it("scrolls the strip so the item sits in its middle", () => {
    const strip = document.createElement("div"), item = document.createElement("div");
    Object.defineProperty(strip, "clientWidth", { value: 600 });
    Object.defineProperty(item, "offsetLeft", { value: 1000 });
    Object.defineProperty(item, "offsetWidth", { value: 150 });
    strip.scrollTo = vi.fn();
    scrollToCentre(strip, item, true);
    expect(strip.scrollTo).toHaveBeenCalledWith({ left: 1000 - (600 - 150) / 2, behavior: "smooth" });
    scrollToCentre(strip, item, false);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: 775, behavior: "auto" });
  });
});
