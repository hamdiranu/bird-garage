import { describe, expect, it, vi } from "vitest";

/** assets.ts reads ASSET_VERSIONS when it loads, so each test loads a fresh copy. */
async function load(versions?: Record<string, string>) {
  vi.resetModules();
  if (versions) vi.stubEnv("ASSET_VERSIONS", JSON.stringify(versions));
  else vi.stubEnv("ASSET_VERSIONS", "");
  return import("../assets");
}

describe("assetUrl", () => {
  it("adds the file's content hash", async () => {
    const { assetUrl } = await load({ "/models/heritage/toyota-limo.glb": "abc123" });
    expect(assetUrl("/models/heritage/toyota-limo.glb")).toBe("/models/heritage/toyota-limo.glb?v=abc123");
  });

  it("leaves unknown files as they are", async () => {
    const { assetUrl } = await load({ "/thumbs/limo.webp": "abc" });
    expect(assetUrl("/thumbs/torana.webp")).toBe("/thumbs/torana.webp");
  });

  it("works with no versions at all (tests, or a missing env)", async () => {
    const { assetUrl } = await load();
    expect(assetUrl("/thumbs/limo.webp")).toBe("/thumbs/limo.webp");
  });
});

describe("thumbPath", () => {
  it("points at the car's WebP, with its hash", async () => {
    const { thumbPath } = await load({ "/thumbs/limo.webp": "f00d" });
    expect(thumbPath("limo")).toBe("/thumbs/limo.webp?v=f00d");
  });
});
