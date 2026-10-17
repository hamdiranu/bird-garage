import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "../useMediaQuery";

/** A controllable media query list. */
function fakeQuery(initial: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: initial,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  vi.stubGlobal("matchMedia", () => mql);
  return { change(to: boolean) { mql.matches = to; listeners.forEach((l) => l()); }, listeners };
}

describe("useMediaQuery", () => {
  it("reports the current match once mounted", () => {
    fakeQuery(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(true);
  });

  it("follows changes, and stops listening when unmounted", () => {
    const q = fakeQuery(false);
    const { result, unmount } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
    act(() => q.change(true));
    expect(result.current).toBe(true);
    unmount();
    expect(q.listeners.size).toBe(0);
  });
});
