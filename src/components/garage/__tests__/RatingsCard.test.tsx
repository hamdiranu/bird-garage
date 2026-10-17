import { screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CARS, overallRating } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import { RatingsCard } from "../RatingsCard";

const car = CARS[0];

function setup(props: Partial<Parameters<typeof RatingsCard>[0]> = {}, lang: "en" | "id" = "en") {
  const all = { cardRef: createRef<HTMLElement>(), car, picked: false, hasPick: false, onTogglePick: vi.fn(), onChangeCar: vi.fn(), onClearPick: vi.fn(), reduceMotion: true, ...props };
  return { props: all, ...renderUI(<RatingsCard {...all} />, { lang }) };
}

describe("RatingsCard", () => {
  it("shows the overall score, written the local way", () => {
    setup();
    expect(screen.getByText(overallRating(car).toFixed(1))).toBeInTheDocument();
  });

  it("writes the score with a decimal comma in Indonesian", () => {
    setup({}, "id");
    expect(screen.getByText(overallRating(car).toFixed(1).replace(".", ","))).toBeInTheDocument();
  });

  it("selects and unselects the car", async () => {
    const { user, props } = setup();
    const button = screen.getByRole("button", { name: /select this car/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(props.onTogglePick).toHaveBeenCalled();
    setup({ picked: true });
    expect(screen.getByRole("button", { name: /^selected$/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("can only clear a pick when there is one", async () => {
    const { user, props } = setup({ hasPick: false });
    expect(screen.getByRole("button", { name: /clear pick/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /change car/i }));
    expect(props.onChangeCar).toHaveBeenCalled();
  });
});
