import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CARS, carsInFilter, findCar } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import { Roster } from "../Roster";

function setup(props: Partial<Parameters<typeof Roster>[0]> = {}) {
  const all = {
    order: carsInFilter("all"), current: 0, pinned: null, pick: null, rollKey: 0, reduceMotion: true,
    timeline: false, onOpenTimeline: vi.fn(), onSelect: vi.fn(), ...props,
  };
  HTMLElement.prototype.scrollTo = vi.fn();
  return { props: all, ...renderUI(<Roster {...all} />) };
}
const cards = () => within(screen.getByRole("navigation", { name: "Car roster" })).getAllByRole("button").filter((b) => b.hasAttribute("data-i"));

describe("Roster", () => {
  it("lists the cars in the order it's given", () => {
    const order = carsInFilter("all", "rating");
    setup({ order });
    expect(cards().map((b) => Number(b.dataset.i))).toEqual(order);
  });

  it("marks the current car, the pick and the pinned car", () => {
    setup({ current: 2, pick: CARS[3].id, pinned: 4 });
    expect(cards()[2]).toHaveAttribute("aria-current", "true");
    expect(within(cards()[3]).getByText("Selected")).toBeInTheDocument();
    expect(within(cards()[4]).getByText("Pinned")).toBeInTheDocument();
  });

  it("selects a car by its index in the fleet", async () => {
    const { user, props } = setup({ order: carsInFilter("heritage") });
    await user.click(screen.getByRole("button", { name: /Holden Torana/ }));
    expect(props.onSelect).toHaveBeenCalledWith(findCar("torana"));
  });

  it("offers the fleet timeline first when asked", async () => {
    const { user, props } = setup({ order: carsInFilter("heritage"), timeline: true });
    const strip = within(screen.getByRole("navigation", { name: "Car roster" })).getAllByRole("button");
    expect(strip.find((b) => !b.hasAttribute("data-i") && b.getAttribute("aria-label") === "Open the fleet timeline")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Open the fleet timeline" }));
    expect(props.onOpenTimeline).toHaveBeenCalled();
  });

  it("shows each car's thumbnail picture", () => {
    setup();
    const img = within(cards()[0]).getByRole("presentation", { hidden: true });
    expect(img.getAttribute("src")).toContain(`/thumbs/${CARS[0].id}.webp`);
  });

  it("keeps the current car scrolled into the middle", () => {
    setup({ current: 5 });
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });
});
