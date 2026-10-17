import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAR_ENTRIES } from "../cars";
import { MAKER_LOGOS } from "../makers";

const exists = (url: string) => existsSync(path.join(process.cwd(), "public", url));

describe("MAKER_LOGOS", () => {
  it("has an emblem for every maker in the fleet", () => {
    for (const maker of new Set(CAR_ENTRIES.map((c) => c.maker))) expect(MAKER_LOGOS[maker], maker).toBeDefined();
  });

  it.each(Object.entries(MAKER_LOGOS))("%s points at files that exist", (_, logo) => {
    expect(exists(logo!.src)).toBe(true);
    if (logo!.dark) expect(exists(logo!.dark)).toBe(true);
  });
});
