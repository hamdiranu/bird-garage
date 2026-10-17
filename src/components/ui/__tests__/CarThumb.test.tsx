import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CARS } from "@/lib/fleet";
import { CarThumb } from "../CarThumb";

const car = CARS[0];

describe("CarThumb", () => {
  it("shows the car's pre-rendered picture at the thumbnail size", () => {
    render(<CarThumb car={car} sketch={{ width: 110, height: 44 }} className="thumb" />);
    const img = screen.getByRole("presentation", { hidden: true });
    expect(img.getAttribute("src")).toContain(`/thumbs/${car.id}.webp`);
    expect(img).toHaveAttribute("width", "260");
    expect(img).toHaveAttribute("height", "130");
    expect(img).toHaveClass("thumb");
  });

  it("falls back to the 2D side view when the picture is missing", () => {
    const { container } = render(<CarThumb car={car} sketch={{ width: 110, height: 44 }} />);
    fireEvent.error(screen.getByRole("presentation", { hidden: true }));
    expect(container.querySelector("img")).toBeNull();
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveStyle({ width: "110px", height: "44px" });
  });
});
