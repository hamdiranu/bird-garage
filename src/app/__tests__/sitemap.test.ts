import { describe, expect, it } from "vitest";
import { CARS } from "@/lib/fleet";
import { siteUrl } from "@/lib/previews";
import sitemap from "../sitemap";

describe("sitemap.xml", () => {
  const entries = sitemap();

  it("lists the garage and every car, once each", () => {
    expect(entries.map((e) => e.url)).toEqual([
      `${siteUrl.origin}/`,
      ...CARS.map((car) => `${siteUrl.origin}/car/${car.id}`),
    ]);
  });

  it("puts the garage ahead of the car pages", () => {
    expect(entries[0].priority).toBe(1);
    expect(entries.slice(1).every((e) => e.priority === 0.8)).toBe(true);
  });

  it("offers each car's preview picture to image search, by its full address", () => {
    const e6 = entries.find((e) => e.url.endsWith("/car/e6-prime"));
    expect(e6?.images).toEqual([`${siteUrl.origin}/previews/e6-prime.jpg`]);
  });

  it("never points at localhost", () => {
    expect(entries.every((e) => e.url.startsWith(siteUrl.origin))).toBe(true);
    expect(siteUrl.hostname).not.toBe("localhost");
  });
});
