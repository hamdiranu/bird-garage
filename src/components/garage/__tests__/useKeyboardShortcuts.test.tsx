import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardShortcuts, type Shortcuts } from "../useKeyboardShortcuts";

function setup(overrides: Partial<Shortcuts> = {}) {
  const keys: Shortcuts = {
    prev: vi.fn(), next: vi.fn(), togglePick: vi.fn(), toggleCompare: vi.fn(), toggleHotspots: vi.fn(),
    toggleFocus: vi.fn(), exitFocus: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), resetZoom: vi.fn(), ...overrides,
  };
  const hook = renderHook((props: Shortcuts) => useKeyboardShortcuts(props), { initialProps: keys });
  return { keys, ...hook };
}
const press = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(document, { key, ...init });

describe("useKeyboardShortcuts", () => {
  it.each([
    ["ArrowRight", "next"], ["ArrowLeft", "prev"], ["Enter", "togglePick"], ["c", "toggleCompare"], ["C", "toggleCompare"],
    ["h", "toggleHotspots"], ["f", "toggleFocus"], ["Escape", "exitFocus"], ["+", "zoomIn"], ["=", "zoomIn"],
    ["-", "zoomOut"], ["0", "resetZoom"],
  ] as const)("%s calls %s", (key, action) => {
    const { keys } = setup();
    press(key);
    expect(keys[action]).toHaveBeenCalledTimes(1);
  });

  it("leaves keys with Ctrl, Alt or ⌘ to the browser", () => {
    const { keys } = setup();
    press("ArrowRight", { ctrlKey: true });
    press("0", { metaKey: true });
    press("f", { altKey: true });
    expect(keys.next).not.toHaveBeenCalled();
    expect(keys.resetZoom).not.toHaveBeenCalled();
    expect(keys.toggleFocus).not.toHaveBeenCalled();
  });

  it("lets Enter press a focused button instead of picking the car", () => {
    const { keys } = setup();
    const button = document.body.appendChild(document.createElement("button"));
    button.focus();
    press("Enter");
    expect(keys.togglePick).not.toHaveBeenCalled();
    button.remove();
  });

  it("does nothing while a dialog is open", () => {
    const { keys } = setup();
    const dialog = document.body.appendChild(document.createElement("dialog"));
    dialog.setAttribute("open", "");
    press("ArrowRight");
    expect(keys.next).not.toHaveBeenCalled();
    dialog.remove();
  });

  it("skips focus view where it isn't offered", () => {
    const { keys } = setup({ toggleFocus: undefined });
    expect(() => press("f")).not.toThrow();
    expect(keys.toggleFocus).toBeUndefined();
  });

  it("calls the latest handlers without re-adding its listener", () => {
    const add = vi.spyOn(document, "addEventListener");
    const { rerender, keys } = setup();
    const next = vi.fn();
    rerender({ ...keys, next });
    press("ArrowRight");
    expect(next).toHaveBeenCalledTimes(1);
    expect(keys.next).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
  });

  it("stops listening when unmounted", () => {
    const { keys, unmount } = setup();
    unmount();
    press("ArrowRight");
    expect(keys.next).not.toHaveBeenCalled();
  });
});
