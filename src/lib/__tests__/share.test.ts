import { describe, expect, it, vi } from "vitest";
import { carPath, shareLink } from "../share";

const URL_ = "https://garage.example/car/limo";

/** A touch screen (pointer: coarse) or a mouse. */
const pointer = (coarse: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: coarse && q.includes("coarse"), media: q, addEventListener() {}, removeEventListener() {} }));

const clipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

describe("carPath", () => {
  it("is the car's page", () => {
    expect(carPath("e6-prime")).toBe("/car/e6-prime");
  });
});

describe("shareLink", () => {
  it("opens the share sheet on a touch screen that has one", async () => {
    pointer(true);
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    expect(await shareLink(URL_, "Limo")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Limo", url: URL_ });
  });

  it("reports a dismissed share sheet as cancelled, without copying", async () => {
    pointer(true);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, share: vi.fn().mockRejectedValue(new DOMException("no", "AbortError")), clipboard: { writeText } });
    expect(await shareLink(URL_, "Limo")).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link with a mouse, even where a share sheet exists", async () => {
    pointer(false);
    const share = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share, clipboard: { writeText } });
    expect(await shareLink(URL_, "Limo")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(URL_);
    expect(share).not.toHaveBeenCalled();
  });

  it("copies the link when the share sheet fails for another reason", async () => {
    pointer(true);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: vi.fn().mockRejectedValue(new TypeError("bad")), clipboard: { writeText } });
    expect(await shareLink(URL_, "Limo")).toBe("copied");
  });

  it("falls back to the old copy command when the clipboard API refuses", async () => {
    pointer(false);
    clipboard(() => Promise.reject(new Error("not allowed")));
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    expect(await shareLink(URL_, "Limo")).toBe("copied");
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull(); // the helper textarea is cleaned up
  });

  it("reports failure when nothing can copy", async () => {
    pointer(false);
    clipboard(() => Promise.reject(new Error("not allowed")));
    document.execCommand = vi.fn().mockReturnValue(false);
    expect(await shareLink(URL_, "Limo")).toBe("failed");
  });
});
