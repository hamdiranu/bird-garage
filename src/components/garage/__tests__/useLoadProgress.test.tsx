import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLoadProgress } from "@/lib/models/progress";
import { useLoadProgress } from "../useLoadProgress";

afterEach(() => { setLoadProgress("a", null); setLoadProgress("b", null); });

describe("useLoadProgress", () => {
  it("is null while nothing is loading", () => {
    const { result } = renderHook(() => useLoadProgress(["a"]));
    expect(result.current).toBeNull();
  });

  it("follows a car's download", () => {
    const { result } = renderHook(() => useLoadProgress(["a"]));
    act(() => setLoadProgress("a", 0.4));
    expect(result.current).toBe(0.4);
    act(() => setLoadProgress("a", null));
    expect(result.current).toBeNull();
  });

  it("averages the cars still loading", () => {
    const { result } = renderHook(() => useLoadProgress(["a", "b"]));
    act(() => { setLoadProgress("a", 0.2); setLoadProgress("b", 0.6); });
    expect(result.current).toBeCloseTo(0.4);
    act(() => setLoadProgress("a", null));
    expect(result.current).toBeCloseTo(0.6);
  });

  it("ignores cars it wasn't asked about", () => {
    const { result } = renderHook(() => useLoadProgress(["a"]));
    act(() => setLoadProgress("b", 0.5));
    expect(result.current).toBeNull();
  });
});
