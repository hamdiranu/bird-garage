import { describe, expect, it } from "vitest";
import { twoDigits } from "../format";

describe("twoDigits", () => {
  it("pads single digits with a zero", () => {
    expect(twoDigits(0)).toBe("00");
    expect(twoDigits(7)).toBe("07");
  });

  it("leaves two or more digits alone", () => {
    expect(twoDigits(16)).toBe("16");
    expect(twoDigits(120)).toBe("120");
  });
});
