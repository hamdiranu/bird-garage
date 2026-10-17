import { describe, expect, it, vi } from "vitest";
import { detectAR } from "../arSupport";

/** Make links claim (or not) that they support rel="ar", as Safari on iOS does. */
const quickLook = (yes: boolean) =>
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag) as HTMLElement;
    if (tag === "a") Object.defineProperty(el, "relList", { value: { supports: (t: string) => yes && t === "ar" } });
    return el;
  }) as typeof document.createElement);

describe("detectAR", () => {
  it("picks AR Quick Look where links support rel=ar (iPhone, iPad)", async () => {
    quickLook(true);
    expect(await detectAR()).toBe("quicklook");
  });

  it("picks WebXR where immersive AR sessions are supported (Android Chrome)", async () => {
    quickLook(false);
    vi.stubGlobal("navigator", { ...navigator, xr: { isSessionSupported: vi.fn().mockResolvedValue(true) } });
    expect(await detectAR()).toBe("webxr");
  });

  it("offers nothing on a desktop browser", async () => {
    quickLook(false);
    vi.stubGlobal("navigator", { ...navigator, xr: { isSessionSupported: vi.fn().mockResolvedValue(false) } });
    expect(await detectAR()).toBeNull();
  });

  it("doesn't fail where links can't be asked about rel tokens (Firefox throws), and still checks WebXR", async () => {
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag) as HTMLElement;
      if (tag === "a") Object.defineProperty(el, "relList", { value: { supports: () => { throw new TypeError("rel attribute has no supported tokens"); } } });
      return el;
    }) as typeof document.createElement);
    vi.stubGlobal("navigator", { ...navigator, xr: { isSessionSupported: vi.fn().mockResolvedValue(true) } });
    await expect(detectAR()).resolves.toBe("webxr");
  });

  it("offers nothing without WebXR, or when asking about it fails", async () => {
    quickLook(false);
    expect(await detectAR()).toBeNull();
    vi.stubGlobal("navigator", { ...navigator, xr: { isSessionSupported: vi.fn().mockRejectedValue(new Error("SecurityError")) } });
    expect(await detectAR()).toBeNull();
  });
});
