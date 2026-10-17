import { describe, expect, it, vi } from "vitest";
import { getLoadProgress, loadProgressVersion, setLoadProgress, subscribeLoadProgress } from "../progress";

describe("load progress", () => {
  it("reports nothing for a car that isn't loading", () => {
    expect(getLoadProgress("nothing-here")).toBeNull();
  });

  it("tracks a load from start to finish", () => {
    setLoadProgress("limo", 0);
    expect(getLoadProgress("limo")).toBe(0);
    setLoadProgress("limo", 0.5);
    expect(getLoadProgress("limo")).toBe(0.5);
    setLoadProgress("limo", null);
    expect(getLoadProgress("limo")).toBeNull();
  });

  it("keeps NaN for a download of unknown size", () => {
    setLoadProgress("torana", NaN);
    expect(getLoadProgress("torana")).toBeNaN();
    setLoadProgress("torana", null);
  });

  it("tells subscribers about each change and bumps the version", () => {
    const listener = vi.fn();
    const stop = subscribeLoadProgress(listener);
    const v = loadProgressVersion();
    setLoadProgress("coach", 0.25);
    setLoadProgress("coach", null);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(loadProgressVersion()).toBe(v + 2);
    stop();
    setLoadProgress("coach", 0.5);
    expect(listener).toHaveBeenCalledTimes(2);
    setLoadProgress("coach", null);
  });
});
