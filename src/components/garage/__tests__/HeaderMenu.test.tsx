import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUI } from "@/testing/render";
import { HeaderMenu } from "../HeaderMenu";

function setup(overrides: Partial<Parameters<typeof HeaderMenu>[0]> = {}) {
  const props = {
    light: false, onToggleTheme: vi.fn(), focus: false, canFocus: true, onToggleFocus: vi.fn(), spin: true, onToggleSpin: vi.fn(),
    showroom: false, onToggleShowroom: vi.fn(), hotspots: false, onToggleHotspots: vi.fn(), onOpenTimeline: vi.fn(), ...overrides,
  };
  return { props, ...renderUI(<HeaderMenu {...props} />) };
}

describe("HeaderMenu", () => {
  it("opens and closes from its button", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menuitemcheckbox", { name: /auto-spin/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.queryByRole("menuitemcheckbox")).toBeNull();
  });

  it("shows each switch's state and flips it", async () => {
    const { user, props } = setup({ spin: true, hotspots: false });
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menuitemcheckbox", { name: /auto-spin/i })).toHaveAttribute("aria-checked", "true");
    const hotspots = screen.getByRole("menuitemcheckbox", { name: /hotspots/i });
    expect(hotspots).toHaveAttribute("aria-checked", "false");
    await user.click(hotspots);
    expect(props.onToggleHotspots).toHaveBeenCalled();
    await user.click(screen.getByRole("menuitemcheckbox", { name: /showroom mode/i }));
    expect(props.onToggleShowroom).toHaveBeenCalled();
  });

  it("offers focus view only where it fits", async () => {
    const { user } = setup({ canFocus: false });
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.queryByRole("menuitemcheckbox", { name: /focus view/i })).toBeNull();
    expect(screen.queryByText("F")).toBeNull();
  });

  it("opens the timeline and closes itself", async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: /fleet timeline/i }));
    expect(props.onOpenTimeline).toHaveBeenCalled();
    expect(screen.queryByRole("menuitemcheckbox")).toBeNull();
  });

  it("lists the keyboard shortcuts", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    for (const key of ["Enter", "C", "H", "F", "0", "Esc"]) expect(screen.getByText(key)).toBeInTheDocument();
  });

  it("closes on Esc and on a click outside", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menuitemcheckbox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menuitemcheckbox")).toBeNull();
  });
});
