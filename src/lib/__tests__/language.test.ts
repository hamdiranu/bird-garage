import { describe, expect, it, vi } from "vitest";
import { applyLanguage, formatNumber, localize, resolveLanguage } from "../language";

describe("resolveLanguage", () => {
  it("uses the saved choice first", () => {
    localStorage.setItem("bluebird-lang", "id");
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    expect(resolveLanguage()).toBe("id");
  });

  it("ignores a saved value that isn't a language", () => {
    localStorage.setItem("bluebird-lang", "fr");
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-GB");
    expect(resolveLanguage()).toBe("en");
  });

  it.each([
    ["id", "id"],
    ["id-ID", "id"],
    ["in", "id"], // the old code some browsers still send
    ["en-US", "en"],
    ["nl-NL", "en"],
  ])("follows the browser language %s → %s", (browser, lang) => {
    vi.spyOn(navigator, "language", "get").mockReturnValue(browser);
    expect(resolveLanguage()).toBe(lang);
  });

  it("falls back to the browser when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(navigator, "language", "get").mockReturnValue("id");
    expect(resolveLanguage()).toBe("id");
  });
});

describe("applyLanguage", () => {
  it("sets <html lang>, and saves only when asked", () => {
    applyLanguage("id");
    expect(document.documentElement.lang).toBe("id");
    expect(localStorage.getItem("bluebird-lang")).toBeNull();
    applyLanguage("en", true);
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem("bluebird-lang")).toBe("en");
  });
});

describe("localize", () => {
  it("returns a plain string as it is", () => {
    expect(localize("Sedan", "id")).toBe("Sedan");
  });

  it("picks the language's version", () => {
    const text = { en: "Petrol", id: "Bensin" };
    expect(localize(text, "en")).toBe("Petrol");
    expect(localize(text, "id")).toBe("Bensin");
  });
});

describe("formatNumber", () => {
  it("writes decimals the local way", () => {
    expect(formatNumber(7.5, "en", { min: 1 })).toBe("7.5");
    expect(formatNumber(7.5, "id", { min: 1 })).toBe("7,5");
  });

  it("groups thousands the local way", () => {
    expect(formatNumber(24500, "en")).toBe("24,500");
    expect(formatNumber(24500, "id")).toBe("24.500");
  });

  it("rounds to the given digits, none by default", () => {
    expect(formatNumber(4.695, "en", { max: 2 })).toBe("4.7");
    expect(formatNumber(4.6, "en")).toBe("5");
  });
});
