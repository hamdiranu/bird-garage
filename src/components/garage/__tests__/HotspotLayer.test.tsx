import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Rig } from "@/components/stage/types";
import { CARS } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import { HotspotLayer } from "../HotspotLayer";

const modelx = CARS.find((c) => c.id === "modelx")!;
const makeRig = (): Rig => ({ yaw: 0, spin: true, dragging: false, hold: false, lastInput: 0, pulse: 0, wake: vi.fn(), offscreen: false });

function setup() {
  const rig = makeRig(), els = { current: [] as (HTMLElement | null)[] };
  return { rig, els, ...renderUI(<HotspotLayer car={modelx} els={els} rigRef={{ current: rig }} />) };
}

describe("HotspotLayer", () => {
  it("puts one button per hotspot, and hands each one to the stage", () => {
    const { els } = setup();
    expect(screen.getAllByRole("button")).toHaveLength(modelx.hotspots!.length);
    expect(els.current.filter(Boolean)).toHaveLength(modelx.hotspots!.length);
    expect(screen.getByRole("button", { name: "Falcon-wing doors" })).toBeInTheDocument();
  });

  it("parks the dots off screen and hidden until the stage places them", () => {
    const { els } = setup();
    expect(els.current[0]).toHaveAttribute("data-hidden", "true");
    expect(els.current[0]!.style.transform).toContain("-200px");
  });

  it("opens a note, holding the car still, and closes it again", async () => {
    const { user, rig } = setup();
    await user.click(screen.getByRole("button", { name: "Charging port" }));
    expect(screen.getByRole("note")).toHaveTextContent("left tail lamp");
    expect(rig.hold).toBe(true);
    expect(rig.wake).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("note")).toBeNull();
    expect(rig.hold).toBe(false);
  });

  it("falls back to the kind's own note", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Yellow plate" }));
    expect(screen.getByRole("note")).toHaveTextContent("yellow number plates");
  });

  it("closes the note on Esc or a tap elsewhere", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Falcon-wing doors" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("note")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Falcon-wing doors" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("releases the car when it unmounts", async () => {
    const { user, rig, unmount } = setup();
    await user.click(screen.getByRole("button", { name: "Falcon-wing doors" }));
    unmount();
    expect(rig.hold).toBe(false);
  });
});
