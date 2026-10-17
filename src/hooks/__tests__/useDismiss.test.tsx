import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDismiss } from "../useDismiss";

function setup(open = true) {
  const panel = document.body.appendChild(document.createElement("div"));
  const inner = panel.appendChild(document.createElement("button"));
  const close = vi.fn();
  const hook = renderHook(({ open }) => useDismiss(open, () => panel, close), { initialProps: { open } });
  return { panel, inner, close, ...hook };
}

describe("useDismiss", () => {
  it("closes on Esc", () => {
    const { close } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes on a press outside, but not inside", () => {
    const { close, inner } = setup();
    fireEvent.pointerDown(inner);
    expect(close).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const { close } = setup();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(close).not.toHaveBeenCalled();
  });

  it("listens only while open", () => {
    const { close, rerender } = setup(false);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).not.toHaveBeenCalled();
    rerender({ open: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
    rerender({ open: false });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("treats everything as outside when there's no element yet", () => {
    const close = vi.fn();
    renderHook(() => useDismiss(true, () => null, close));
    fireEvent.pointerDown(document.body);
    expect(close).toHaveBeenCalled();
  });
});
