import { describe, expect, it, vi } from "vitest";
import { THEME_KEY, applyTheme, resolveTheme, themeScript } from "../theme";

const prefersLight = (light: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: light && q.includes("light"), media: q, addEventListener() {}, removeEventListener() {} }));

describe("resolveTheme", () => {
  it("uses the saved choice first", () => {
    prefersLight(true);
    localStorage.setItem(THEME_KEY, "dark");
    expect(resolveTheme()).toBe("dark");
  });

  it("follows the system setting when nothing valid is saved", () => {
    localStorage.setItem(THEME_KEY, "sepia");
    prefersLight(true);
    expect(resolveTheme()).toBe("light");
    prefersLight(false);
    expect(resolveTheme()).toBe("dark");
  });

  it("falls back to dark if storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(resolveTheme()).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("sets data-theme on <html>, and saves only when asked", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    applyTheme("dark", true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });
});

describe("themeScript", () => {
  // The inline <head> script must make the same choice as resolveTheme, before React loads.
  const run = () => new Function(themeScript)();

  it("applies the saved theme", () => {
    localStorage.setItem(THEME_KEY, "light");
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("follows the system setting otherwise", () => {
    prefersLight(true);
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
    prefersLight(false);
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("is plain script with no markup that could end the <script> tag", () => {
    expect(themeScript).not.toMatch(/<\/?script/i);
  });
});
