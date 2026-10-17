import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUI } from "@/testing/render";
import { Toolbar, type ToolbarProps } from "../Toolbar";
import { ZOOM } from "../view";

function setup(overrides: Partial<ToolbarProps> = {}) {
  const props: ToolbarProps = {
    spin: true, zoom: 1, comparing: false, canAR: false,
    onAim: vi.fn(), onSpin: vi.fn(), onCompare: vi.fn(), onAR: vi.fn(), onZoomIn: vi.fn(), onZoomOut: vi.fn(), onZoomReset: vi.fn(),
    ...overrides,
  };
  return { props, ...renderUI(<Toolbar {...props} />) };
}

describe("Toolbar", () => {
  it("aims the camera at each preset", async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole("button", { name: "Front" }));
    await user.click(screen.getByRole("button", { name: "Side" }));
    await user.click(screen.getByRole("button", { name: "Rear" }));
    expect(vi.mocked(props.onAim).mock.calls.map(([v]) => v)).toEqual(["front", "side", "rear"]);
  });

  it("shows spin and compare as toggles", async () => {
    const { user, props } = setup({ spin: true, comparing: false });
    expect(screen.getByRole("button", { name: "Spin" })).toHaveAttribute("aria-pressed", "true");
    const compare = screen.getByRole("button", { name: "Compare" });
    expect(compare).toHaveAttribute("aria-pressed", "false");
    expect(compare).toHaveAttribute("title", "Compare with another car (C)");
    await user.click(compare);
    expect(props.onCompare).toHaveBeenCalled();
  });

  it("offers AR only where the device can do it", async () => {
    setup({ canAR: false });
    expect(screen.queryByRole("button", { name: "View in your space" })).toBeNull();
    const { user, props } = setup({ canAR: true });
    await user.click(screen.getByRole("button", { name: "View in your space" }));
    expect(props.onAR).toHaveBeenCalled();
  });

  it("shows the zoom, resets it, and disables the buttons at the limits", async () => {
    const { user, props } = setup({ zoom: 1.25 });
    await user.click(screen.getByRole("button", { name: /zoom 125%/i }));
    expect(props.onZoomReset).toHaveBeenCalled();
    setup({ zoom: ZOOM.max });
    expect(screen.getAllByRole("button", { name: "Zoom in" }).at(-1)).toBeDisabled();
    setup({ zoom: ZOOM.min });
    expect(screen.getAllByRole("button", { name: "Zoom out" }).at(-1)).toBeDisabled();
  });
});
