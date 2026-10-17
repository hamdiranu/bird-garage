import { describe, expect, it, vi } from "vitest";
import type * as THREE from "three";

describe("firstRenderer", () => {
  it("resolves with the first renderer handed over, and ignores later ones", async () => {
    vi.resetModules();
    const { firstRenderer, provideRenderer } = await import("../gpu");
    const stage = { name: "stage" } as unknown as THREE.WebGLRenderer;
    const capture = { name: "capture" } as unknown as THREE.WebGLRenderer;
    provideRenderer(stage);
    provideRenderer(capture);
    await expect(firstRenderer).resolves.toBe(stage);
  });

  it("waits until a renderer arrives", async () => {
    vi.resetModules();
    const { firstRenderer, provideRenderer } = await import("../gpu");
    let done = false;
    void firstRenderer.then(() => { done = true; });
    await Promise.resolve();
    expect(done).toBe(false);
    provideRenderer({} as THREE.WebGLRenderer);
    await firstRenderer;
    expect(done).toBe(true);
  });
});
