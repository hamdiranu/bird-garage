import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFitText } from "../useFitText";

/** An element whose text is `textPx` wide at 48px and shrinks in proportion with its font size. */
function heading(textPx: number, boxPx: number) {
  const el = document.createElement("h2");
  Object.defineProperty(el, "clientWidth", { value: boxPx });
  Object.defineProperty(el, "scrollWidth", { get: () => (textPx * (parseFloat(el.style.fontSize) || 48)) / 48 });
  vi.spyOn(window, "getComputedStyle").mockReturnValue({ fontSize: "48px" } as CSSStyleDeclaration);
  return el;
}

describe("useFitText", () => {
  it("leaves text that fits at its own size", () => {
    const el = heading(200, 300);
    renderHook(() => useFitText({ current: el }, "Limo"));
    expect(el.style.fontSize).toBe("");
  });

  it("shrinks long text 2px at a time until it fits", () => {
    const el = heading(400, 300);
    renderHook(() => useFitText({ current: el }, "Hiace Commuter"));
    const px = parseFloat(el.style.fontSize);
    expect((400 * px) / 48).toBeLessThanOrEqual(301);
    expect((400 * (px + 2)) / 48).toBeGreaterThan(301);
  });

  it("stops at the minimum size", () => {
    const el = heading(5000, 300);
    renderHook(() => useFitText({ current: el }, "Very long", 20));
    expect(parseFloat(el.style.fontSize)).toBe(20);
  });
});
