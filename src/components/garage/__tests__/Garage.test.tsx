import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CARS, carsInFilter } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import Garage from "../Garage";

/* The page as a whole, in jsdom: no WebGL, so the stage shows the 2D drawing, but every card, list and control
   works as it does in the browser. */

beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

const model = () => screen.getAllByRole("heading", { level: 2 })[0].textContent;
const roster = () => within(screen.getByRole("navigation", { name: "Car roster" }));

describe("Garage", () => {
  it("opens on the first car, with the no-WebGL drawing", async () => {
    renderUI(<Garage />);
    await waitFor(() => expect(screen.getByText(/WebGL switched off/)).toBeInTheDocument());
    expect(model()).toBe(CARS[0].model);
    expect(screen.getByText("01", { selector: "header b" })).toBeInTheDocument();
  });

  it("opens on the page's car, and a #car link wins over it", async () => {
    renderUI(<Garage initialCar="limo" />);
    await waitFor(() => expect(model()).toBe("Limo"));
    location.hash = "torana";
    renderUI(<Garage initialCar="limo" />);
    await waitFor(() => expect(screen.getAllByRole("heading", { level: 2 }).some((h) => h.textContent === "Torana")).toBe(true));
    location.hash = "";
  });

  it("changes car with the arrows and the keyboard, wrapping round", async () => {
    const { user } = renderUI(<Garage />);
    await user.click(screen.getByRole("button", { name: "Next car" }));
    expect(model()).toBe(CARS[1].model);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(model()).toBe(CARS.at(-1)!.model);
  });

  it("filters, jumping to the filter's first car", async () => {
    const { user } = renderUI(<Garage />);
    await user.click(screen.getByRole("button", { name: "Heritage" }));
    const heritage = carsInFilter("heritage");
    expect(model()).toBe(CARS[heritage[0]].model);
    expect(roster().getAllByRole("button").filter((b) => b.hasAttribute("data-i"))).toHaveLength(heritage.length);
    expect(roster().getByRole("button", { name: "Open the fleet timeline" })).toBeInTheDocument();
  });

  it("sorts the roster and remembers the order", async () => {
    const { user } = renderUI(<Garage />);
    await user.click(screen.getByRole("button", { name: /sort the cars/i }));
    await user.click(screen.getByRole("button", { name: "Most seats" }));
    const first = roster().getAllByRole("button").find((b) => b.hasAttribute("data-i"))!;
    expect(Number(first.dataset.i)).toBe(carsInFilter("all", "seats")[0]);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("bluebird-fleet-select")!).sort).toBe("seats"));
  });

  it("picks a car, and remembers the pick", async () => {
    const { user } = renderUI(<Garage />);
    await user.click(screen.getByRole("button", { name: /select this car/i }));
    expect(screen.getAllByText("Selected").length).toBeGreaterThan(0);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("bluebird-fleet-select")!).pick).toBe(CARS[0].id));
  });

  it("compares two cars, swaps them and leaves compare mode", async () => {
    const { user } = renderUI(<Garage />);
    fireEvent.keyDown(document, { key: "c" });
    const specs = screen.getByRole("region", { name: "Side by side" });
    expect(within(specs).getByText(CARS[0].model)).toBeInTheDocument();
    expect(within(specs).getByText(CARS[1].model)).toBeInTheDocument();
    expect(roster().getByText("Pinned")).toBeInTheDocument();
    // the arrows change the right-hand car, passing over the pinned one
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(within(screen.getByRole("region", { name: "Side by side" })).getByText(CARS.at(-1)!.model)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Swap" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("region", { name: "Side by side" })).toBeNull();
    expect(model()).toBe(CARS[0].model);
  });

  it("opens the fleet timeline from the menu and shows a milestone's car", async () => {
    const { user } = renderUI(<Garage />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: /fleet timeline/i }));
    await user.click(screen.getByRole("button", { name: /view car · torana/i }));
    expect(model()).toBe("Torana");
  });

  it("switches the hotspots setting from the keyboard and saves it", async () => {
    renderUI(<Garage />);
    fireEvent.keyDown(document, { key: "h" });
    await waitFor(() => expect(JSON.parse(localStorage.getItem("bluebird-fleet-select")!).hotspots).toBe(true));
  });
});
