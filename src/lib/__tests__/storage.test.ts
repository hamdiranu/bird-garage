import { describe, expect, it, vi } from "vitest";
import { loadGarage, saveGarage } from "../storage";

const KEY = "bluebird-fleet-select";

describe("loadGarage", () => {
  it("is empty on a first visit", () => {
    expect(loadGarage()).toEqual({});
  });

  it("reads back what was saved", () => {
    saveGarage({ pick: "limo", last: "torana", spin: false, showroom: true, sort: "rating", hotspots: true });
    expect(loadGarage()).toEqual({ pick: "limo", last: "torana", spin: false, showroom: true, sort: "rating", hotspots: true });
  });

  it("drops values of the wrong type or an unknown sort", () => {
    localStorage.setItem(KEY, JSON.stringify({ pick: 3, last: null, spin: "no", showroom: 1, sort: "price", hotspots: "yes" }));
    expect(loadGarage()).toEqual({ pick: undefined, last: undefined, spin: undefined, showroom: undefined, sort: undefined, hotspots: undefined });
  });

  it("survives broken JSON", () => {
    localStorage.setItem(KEY, "{not json");
    expect(loadGarage()).toEqual({});
  });

  it("survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(loadGarage()).toEqual({});
  });
});

describe("saveGarage", () => {
  it("stores the state as JSON under one key", () => {
    saveGarage({ pick: null, last: "e6-prime", spin: true, showroom: false, sort: "fleet", hotspots: false });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ pick: null, last: "e6-prime", spin: true, showroom: false, sort: "fleet", hotspots: false });
  });

  it("doesn't throw when storage is full or blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(() => saveGarage({ pick: null, last: "limo", spin: true, showroom: false, sort: "fleet", hotspots: false })).not.toThrow();
  });
});
