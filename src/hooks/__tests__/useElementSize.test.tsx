import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useElementSize } from "../useElementSize";

describe("useElementSize", () => {
  it("starts at the initial size, then follows the element's resizes", () => {
    let report: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(cb: ResizeObserverCallback) { report = cb; }
      observe() {}
      disconnect = disconnect;
    });
    const ref = { current: document.createElement("div") };
    const { result, unmount } = renderHook(() => useElementSize(ref, { width: 10, height: 20 }));
    expect(result.current).toEqual({ width: 10, height: 20 });
    act(() => report([{ contentRect: { width: 640, height: 360 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(result.current).toEqual({ width: 640, height: 360 });
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("keeps the initial size when there's no element", () => {
    const { result } = renderHook(() => useElementSize({ current: null }));
    expect(result.current).toEqual({ width: 400, height: 300 });
  });
});
