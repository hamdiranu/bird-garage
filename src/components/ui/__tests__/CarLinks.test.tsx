import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CARS } from "@/lib/fleet";
import { CarLinks } from "../CarLinks";

/* The roster swaps cars with buttons, so these links are the only way a crawler — or a screen reader after a
   permalink — gets from one page to another. */

describe("CarLinks", () => {
  it("links to every car's page from the garage", () => {
    render(<CarLinks />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(CARS.length);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(CARS.map((car) => `/car/${car.id}`));
    expect(screen.getByRole("link", { name: "Toyota Limo" })).toBeInTheDocument();
  });

  it("drops the car whose page it is and offers the way back instead", () => {
    render(<CarLinks except="limo" />);
    expect(screen.queryByRole("link", { name: "Toyota Limo" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bird Garage" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link")).toHaveLength(CARS.length);
  });

  it("stays out of the way on screen", () => {
    render(<CarLinks />);
    expect(screen.getByRole("navigation", { name: "Every car in the fleet" })).toHaveClass("sr-only");
  });
});
