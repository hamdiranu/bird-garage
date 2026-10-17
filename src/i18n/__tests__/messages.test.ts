import { describe, expect, it } from "vitest";
import { MESSAGES } from "../messages";

/** Every leaf of a message table, as [path, value]. */
function leaves(node: unknown, at = ""): [string, unknown][] {
  if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => leaves(v, at ? `${at}.${k}` : k));
  return [[at, node]];
}

describe("MESSAGES", () => {
  const en = leaves(MESSAGES.en), id = leaves(MESSAGES.id);

  it("has the same strings in English and Indonesian", () => {
    expect(id.map(([k]) => k)).toEqual(en.map(([k]) => k));
  });

  it("has no empty strings", () => {
    for (const [key, value] of [...en, ...id]) if (typeof value === "string") expect(value.trim(), key).not.toBe("");
  });

  it("has the same kind of value for each key (text or a function of the same arity)", () => {
    const idMap = new Map(id);
    for (const [key, value] of en) {
      const other = idMap.get(key);
      expect(typeof other, key).toBe(typeof value);
      if (typeof value === "function") expect((other as (...a: unknown[]) => unknown).length, key).toBe(value.length);
    }
  });

  it("fills in its templates", () => {
    expect(MESSAGES.en.stage.model("Toyota", "Limo")).toContain("Toyota Limo");
    expect(MESSAGES.id.stage.model("Toyota", "Limo")).toContain("Toyota Limo");
    expect(MESSAGES.en.toolbar.zoomLevel(125)).toContain("125%");
    expect(MESSAGES.id.compare.winner("Limo")).toContain("Limo");
    expect(MESSAGES.en.share.text("BYD", "e6 Prime")).toContain("BYD e6 Prime");
  });

  it("actually translates (most Indonesian strings differ from the English)", () => {
    const enMap = new Map(en);
    const same = id.filter(([k, v]) => typeof v === "string" && v === enMap.get(k)).map(([k]) => k);
    // names, units and loanwords may match; a large share matching means a section was copied untranslated
    expect(same.length / id.length).toBeLessThan(0.15);
  });
});
