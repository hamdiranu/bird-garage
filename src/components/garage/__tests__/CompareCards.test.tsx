import { screen, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CARS, overallRating } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import type { Car } from "@/types/fleet";
import { CompareRatingsCard, CompareSpecsCard } from "../CompareCards";

const byId = (id: string) => CARS.find((c) => c.id === id)!;
const e6 = byId("e6-prime"), coach = byId("coach");

describe("CompareSpecsCard", () => {
  it("puts both cars side by side, pinned on the left", () => {
    renderUI(<CompareSpecsCard cardRef={createRef()} pinned={e6} car={coach} />);
    const card = screen.getByRole("region", { name: "Side by side" });
    const names = within(card).getAllByText(/e6 Prime|Charter Coach/).map((n) => n.textContent);
    expect(names).toEqual(["e6 Prime", "Charter Coach"]);
  });

  it("lists each spec for both cars", () => {
    renderUI(<CompareSpecsCard cardRef={createRef()} pinned={e6} car={coach} />);
    expect(screen.getByText("Electric")).toBeInTheDocument();
    expect(screen.getByText("Diesel")).toBeInTheDocument();
    expect(screen.getByText("4.7 m")).toBeInTheDocument();
    expect(screen.getByText("12 m")).toBeInTheDocument();
  });
});

describe("CompareRatingsCard", () => {
  const card = (pinned: Car, car: Car, fns = { onSwap: vi.fn(), onDone: vi.fn() }) => ({
    fns, ...renderUI(<CompareRatingsCard cardRef={createRef()} pinned={pinned} car={car} {...fns} />),
  });

  it("names the car that rates higher overall", () => {
    card(e6, coach);
    const winner = overallRating(e6) > overallRating(coach) ? e6 : coach;
    expect(screen.getByText(`${winner.short} rates higher overall`)).toBeInTheDocument();
  });

  it("calls a tie a tie", () => {
    const twin = { ...e6, id: "twin", short: "Twin" };
    card(e6, twin);
    expect(screen.getByText("Level overall")).toBeInTheDocument();
  });

  it("shows every rating for both cars", () => {
    card(e6, coach);
    for (const label of ["Seats", "Comfort", "Eco", "City agility"]) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getAllByText(String(coach.ratings.capacity)).length).toBeGreaterThan(0);
  });

  it("swaps sides and finishes", async () => {
    const { user, fns } = card(e6, coach);
    await user.click(screen.getByRole("button", { name: /swap/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(fns.onSwap).toHaveBeenCalledTimes(1);
    expect(fns.onDone).toHaveBeenCalledTimes(1);
  });
});
