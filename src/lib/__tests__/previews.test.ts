import { describe, expect, it, vi } from "vitest";
import { CARS } from "../fleet";

vi.mock("node:fs", async (original) => {
  const fs = await original<typeof import("node:fs")>();
  return { ...fs, existsSync: vi.fn(fs.existsSync) };
});

const { existsSync } = await import("node:fs");
const { PREVIEW_SIZE, carMetadata } = await import("../previews");

const limo = CARS.find((c) => c.id === "limo")!;

describe("carMetadata", () => {
  it("names the car and uses its English blurb", () => {
    const m = carMetadata(limo, "/car/limo");
    expect(m.title).toBe("Toyota Limo · Bird Garage");
    expect(m.description).toBe(typeof limo.blurb === "string" ? limo.blurb : limo.blurb.en);
    expect(m.alternates?.canonical).toBe("/car/limo");
  });

  it("takes its own title and description when given", () => {
    const m = carMetadata(limo, "/", { title: "Bird Garage", description: "The fleet in 3D." });
    expect(m.title).toBe("Bird Garage");
    expect(m.openGraph?.description).toBe("The fleet in 3D.");
  });

  it("shares the car's picture as a large card when its preview exists", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const m = carMetadata(limo, "/car/limo");
    expect(m.openGraph?.images).toEqual([{ url: "/previews/limo.jpg", ...PREVIEW_SIZE, alt: expect.stringContaining("Toyota Limo") }]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: ["/previews/limo.jpg"] });
  });

  it("shares without a picture, rather than a broken one, when the preview is missing", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const m = carMetadata(limo, "/car/limo");
    expect(m.openGraph?.images).toBeUndefined();
    expect(m.twitter).toMatchObject({ card: "summary" });
  });
});
