import { describe, expect, it } from "vitest";
import { CAR_ENTRIES, DEFAULT_PROFILE } from "@/data/cars";
import { CARS, RATING_KEYS, SORT_KEYS, carsInFilter, findCar, matchesFilter, overallRating } from "../fleet";

describe("CARS", () => {
  it("keeps every entry, in roster order", () => {
    expect(CARS.map((c) => c.id)).toEqual(CAR_ENTRIES.map((e) => e.id));
  });

  it("fills each profile from the defaults, with the entry's own values winning", () => {
    const car = CARS[0], entry = CAR_ENTRIES[0];
    for (const [key, value] of Object.entries(DEFAULT_PROFILE)) {
      const own = entry.profile[key as keyof typeof entry.profile];
      expect(car.profile[key as keyof typeof car.profile]).toEqual(own ?? value);
    }
  });

  it("gives every car an outline to draw", () => {
    for (const car of CARS) expect(car.outline.body.length).toBeGreaterThan(3);
  });
});

describe("overallRating", () => {
  it("is the mean of the four ratings", () => {
    const car = CARS[0];
    const sum = RATING_KEYS.reduce((s, k) => s + car.ratings[k], 0);
    expect(overallRating(car)).toBe(sum / 4);
  });
});

describe("matchesFilter", () => {
  it("matches everything for 'all' and only the car's service otherwise", () => {
    const car = CARS.find((c) => c.service === "heritage")!;
    expect(matchesFilter(car, "all")).toBe(true);
    expect(matchesFilter(car, "heritage")).toBe(true);
    expect(matchesFilter(car, "bluebird")).toBe(false);
  });
});

describe("carsInFilter", () => {
  const ids = (indexes: number[]) => indexes.map((i) => CARS[i].id);

  it("lists a service's cars in roster order", () => {
    const shown = carsInFilter("heritage");
    expect(shown.every((i) => CARS[i].service === "heritage")).toBe(true);
    expect(shown).toEqual([...shown].sort((a, b) => a - b));
  });

  it("lists every car for 'all'", () => {
    expect(carsInFilter("all")).toHaveLength(CARS.length);
  });

  it("sorts by overall rating, best first, ties in roster order", () => {
    const shown = carsInFilter("all", "rating");
    for (let k = 1; k < shown.length; k++) {
      const a = overallRating(CARS[shown[k - 1]]), b = overallRating(CARS[shown[k]]);
      expect(a).toBeGreaterThanOrEqual(b);
      if (a === b) expect(shown[k - 1]).toBeLessThan(shown[k]);
    }
  });

  it("sorts by the Seats rating, most first", () => {
    const seats = carsInFilter("all", "seats").map((i) => CARS[i].ratings.capacity);
    expect(seats).toEqual([...seats].sort((a, b) => b - a));
  });

  it("puts electric cars first, then petrol, then diesel", () => {
    const order = { electric: 0, petrol: 1, diesel: 2 };
    const powers = carsInFilter("all", "electric").map((i) => order[CARS[i].power]);
    expect(powers).toEqual([...powers].sort((a, b) => a - b));
  });

  it("sorts within a filter too", () => {
    expect(ids(carsInFilter("heritage", "rating")).sort()).toEqual(ids(carsInFilter("heritage")).sort());
  });

  it("doesn't reorder the shared fleet", () => {
    carsInFilter("all", "rating");
    expect(carsInFilter("all")).toEqual(CARS.map((_, i) => i));
  });

  it("offers every sort order", () => {
    expect(SORT_KEYS).toEqual(["fleet", "rating", "seats", "electric"]);
  });
});

describe("findCar", () => {
  it("returns the car's index, or -1", () => {
    expect(findCar(CARS[3].id)).toBe(3);
    expect(findCar("no-such-car")).toBe(-1);
    expect(findCar("")).toBe(-1);
  });
});
