import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FILTERS, SERVICES, filterBadge } from "../services";

describe("SERVICES", () => {
  it.each(Object.entries(SERVICES))("%s has a name, role, accent and badge file", (_, s) => {
    expect(s.name).not.toBe("");
    expect(typeof s.role === "string" ? s.role : s.role.id).not.toBe("");
    expect(s.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(existsSync(path.join(process.cwd(), "public", s.badge))).toBe(true);
  });
});

describe("FILTERS", () => {
  it("starts with All and lists every service once", () => {
    expect(FILTERS[0]).toBe("all");
    expect([...FILTERS.slice(1)].sort()).toEqual(Object.keys(SERVICES).sort());
  });
});

describe("filterBadge", () => {
  it("gives All the group's own Bluebird badge", () => {
    expect(filterBadge("all")).toBe(SERVICES.bluebird.badge);
    expect(filterBadge("heritage")).toBe(SERVICES.heritage.badge);
  });
});
