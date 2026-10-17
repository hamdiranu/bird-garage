import { describe, expect, it } from "vitest";
import { CARS } from "../fleet";
import { makeOutline } from "../outline";

describe("makeOutline", () => {
  it.each(CARS.map((c) => [c.id, c] as const))("draws %s inside its own length and height", (_, car) => {
    const { L, H, wb, fo } = car.profile;
    const o = makeOutline(car.profile);
    for (const [x, y] of [...o.body, ...o.green]) {
      expect(x).toBeGreaterThanOrEqual(-1e-6);
      expect(x).toBeLessThanOrEqual(L + 1e-6);
      expect(y).toBeGreaterThanOrEqual(-1e-6);
      expect(y).toBeLessThanOrEqual(H + 1e-6);
    }
    // the axles sit a wheelbase apart, the front one an overhang back from the bumper
    expect(o.axF).toBeCloseTo(fo);
    expect(o.axR - o.axF).toBeCloseTo(wb);
    expect(o.ra).toBeGreaterThan(car.profile.wr);
  });

  it("gives each car as many window panes as its profile asks", () => {
    for (const car of CARS) expect(makeOutline(car.profile).panes).toHaveLength(car.profile.panes);
  });

  it("is deterministic", () => {
    expect(makeOutline(CARS[0].profile)).toEqual(makeOutline(CARS[0].profile));
  });
});
