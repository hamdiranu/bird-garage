import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Text } from "@/types/i18n";
import { CAR_ENTRIES } from "../cars";
import { SERVICES } from "../services";

/* Checks on the fleet data itself: the mistakes that would only show up as a broken card or a missing model. */

const publicFile = (url: string) => path.join(process.cwd(), "public", url);
const texts = (t: Text) => (typeof t === "string" ? [t] : [t.en, t.id]);

describe("CAR_ENTRIES", () => {
  it("has unique ids that are safe in a URL", () => {
    const ids = CAR_ENTRIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(CAR_ENTRIES.map((c) => [c.id, c] as const))("%s is complete and consistent", (_, car) => {
    expect(SERVICES[car.service]).toBeDefined();
    expect(car.paint).toMatch(/^#[0-9a-f]{6}$/i);
    for (const t of [car.blurb, car.body, car.seats, car.note]) for (const s of texts(t)) expect(s.trim()).not.toBe("");
    for (const r of Object.values(car.ratings)) {
      expect(Number.isInteger(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(10);
    }
    const { L, W, H } = car.profile;
    expect(L).toBeGreaterThan(3);
    expect(W).toBeGreaterThan(1.4);
    expect(H).toBeGreaterThan(1.2);
  });

  it.each(CAR_ENTRIES.filter((c) => c.scan).map((c) => [c.id, c] as const))("%s has its scan in its service's folder", (_, car) => {
    expect(car.scan!.src).toMatch(new RegExp(`^/models/${car.service}/[a-z0-9-]+\\.glb$`));
    expect(existsSync(publicFile(car.scan!.src))).toBe(true);
  });

  it.each(CAR_ENTRIES.map((c) => [c.id] as const))("%s has a thumbnail and a link preview", (id) => {
    expect(existsSync(publicFile(`/thumbs/${id}.webp`))).toBe(true);
    expect(existsSync(publicFile(`/previews/${id}.jpg`))).toBe(true);
  });

  it("places every hotspot on or just above the car", () => {
    for (const car of CAR_ENTRIES) {
      for (const h of car.hotspots ?? []) {
        const [along, up, across] = h.at;
        expect(along, `${car.id} ${h.kind}`).toBeGreaterThanOrEqual(0);
        expect(along, `${car.id} ${h.kind}`).toBeLessThanOrEqual(1);
        expect(up, `${car.id} ${h.kind}`).toBeGreaterThan(0);
        expect(up, `${car.id} ${h.kind}`).toBeLessThan(1.5);
        expect(Math.abs(across), `${car.id} ${h.kind}`).toBeLessThanOrEqual(1);
        if (h.note) for (const s of texts(h.note)) expect(s.trim()).not.toBe("");
      }
    }
  });

  it("only puts roof-sign hotspots on cars with a sign, and plate ones on yellow plates", () => {
    for (const car of CAR_ENTRIES) {
      for (const h of car.hotspots ?? []) {
        if (h.kind === "sign") expect(car.sign, car.id).toBeDefined();
        if (h.kind === "plate") expect(car.plate, car.id).toBe("yellow");
        if (h.kind === "charge") expect(car.power, car.id).toBe("electric");
      }
    }
  });
});
