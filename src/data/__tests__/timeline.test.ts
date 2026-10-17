import { describe, expect, it } from "vitest";
import { CAR_ENTRIES } from "../cars";
import { TIMELINE } from "../timeline";

describe("TIMELINE", () => {
  it("only shows cars that are in the fleet", () => {
    const ids = new Set(CAR_ENTRIES.map((c) => c.id));
    for (const m of TIMELINE) if (m.car) expect(ids.has(m.car), `${m.year} → ${m.car}`).toBe(true);
  });

  it("runs oldest first, with each year once", () => {
    const years = TIMELINE.map((m) => parseInt(m.year, 10));
    expect(years).toEqual([...years].sort((a, b) => a - b));
    expect(new Set(TIMELINE.map((m) => m.year)).size).toBe(TIMELINE.length);
  });

  it("has every milestone written in both languages", () => {
    for (const m of TIMELINE) {
      for (const t of [m.title, m.note]) {
        const both = typeof t === "string" ? [t] : [t.en, t.id];
        for (const s of both) expect(s.trim(), m.year).not.toBe("");
      }
    }
  });
});
