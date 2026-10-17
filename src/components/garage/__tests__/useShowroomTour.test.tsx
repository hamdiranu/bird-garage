import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_IDLE_MS, useShowroomTour } from "../useShowroomTour";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("useShowroomTour", () => {
  it("does nothing while switched off", () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useShowroomTour(false, advance, 5000));
    wait(60_000);
    expect(result.current).toBe(false);
    expect(advance).not.toHaveBeenCalled();
  });

  it("starts touring after the idle time, and steps every 9 seconds", () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useShowroomTour(true, advance, 5000));
    wait(4000);
    expect(result.current).toBe(false);
    wait(2000);
    expect(result.current).toBe(true);
    expect(advance).not.toHaveBeenCalled(); // the car on stage gets its full turn first
    wait(9000);
    expect(advance).toHaveBeenCalledTimes(1);
    wait(9000);
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it("hands control back on any input, and waits a full idle time again", () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useShowroomTour(true, advance, 5000));
    wait(6000);
    expect(result.current).toBe(true);
    act(() => { fireEvent.pointerDown(window); });
    expect(result.current).toBe(false);
    wait(4000);
    expect(result.current).toBe(false);
    wait(2000);
    expect(result.current).toBe(true);
  });

  it("ends the tour when switched off", () => {
    const { result, rerender } = renderHook(({ on }) => useShowroomTour(on, () => {}, 5000), { initialProps: { on: true } });
    wait(6000);
    expect(result.current).toBe(true);
    rerender({ on: false });
    expect(result.current).toBe(false);
  });

  it("calls the latest advance function", () => {
    const first = vi.fn(), second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useShowroomTour(true, fn, 5000), { initialProps: { fn: first } });
    rerender({ fn: second });
    wait(6000 + 9000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("waits a minute by default", () => {
    expect(DEFAULT_IDLE_MS).toBe(60_000);
  });
});
