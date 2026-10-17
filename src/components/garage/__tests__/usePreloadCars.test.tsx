import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARS } from "@/lib/fleet";
import type { Car } from "@/types/fleet";

const loadCar = vi.fn<(car: Car) => Promise<void>>(() => Promise.resolve());
vi.mock("@/lib/models/loadCar", () => ({ loadCar }));
const { usePreloadCars } = await import("../usePreloadCars");

beforeEach(() => { vi.useFakeTimers(); loadCar.mockClear(); });
afterEach(() => { vi.useRealTimers(); });

/** Let the timer fire and the on-demand import settle. */
const settle = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); };

describe("usePreloadCars", () => {
  it("loads the cars a moment after they're asked for", async () => {
    renderHook(() => usePreloadCars([1, 2], true));
    expect(loadCar).not.toHaveBeenCalled();
    await settle();
    expect(loadCar.mock.calls.map(([c]) => c.id)).toEqual([CARS[1].id, CARS[2].id]);
  });

  it("does nothing while switched off (no WebGL, or a capture)", async () => {
    renderHook(() => usePreloadCars([1], false));
    await settle();
    expect(loadCar).not.toHaveBeenCalled();
  });

  it("drops a request that changes before the delay is up", async () => {
    const { rerender } = renderHook(({ ids }) => usePreloadCars(ids, true), { initialProps: { ids: [1] } });
    rerender({ ids: [3] });
    await settle();
    expect(loadCar).toHaveBeenCalledTimes(1);
    expect(loadCar.mock.calls[0][0]).toBe(CARS[3]);
  });

  it("does nothing for an empty list", async () => {
    renderHook(() => usePreloadCars([], true));
    await settle();
    expect(loadCar).not.toHaveBeenCalled();
  });
});
