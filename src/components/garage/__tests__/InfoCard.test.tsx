import { act, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { SERVICES } from "@/data/services";
import { CARS } from "@/lib/fleet";
import { renderUI } from "@/testing/render";

const shareLink = vi.fn();
vi.mock("@/lib/share", async (original) => ({ ...(await original<typeof import("@/lib/share")>()), shareLink }));
const { InfoCard } = await import("../InfoCard");

const limo = CARS.find((c) => c.id === "limo")!;
const setup = (lang: "en" | "id" = "en") =>
  renderUI(<InfoCard cardRef={createRef()} car={limo} service={SERVICES[limo.service]} reduceMotion />, { lang });

describe("InfoCard", () => {
  it("shows the car's service, maker, model and specs", () => {
    setup();
    expect(screen.getByText("Heritage")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Limo" })).toBeInTheDocument();
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("4.41 m")).toBeInTheDocument();
  });

  it("translates the specs and the blurb", () => {
    setup("id");
    expect(screen.getByText("Bensin")).toBeInTheDocument();
    expect(screen.getByText("4,41 m")).toBeInTheDocument();
    expect(screen.getByText(/Sedan berbasis Vios/)).toBeInTheDocument();
  });

  it("shares the car's page and confirms the copy", async () => {
    shareLink.mockResolvedValue("copied");
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Share this car" }));
    expect(shareLink).toHaveBeenCalledWith(`${location.origin}/car/limo`, "The Toyota Limo in Bird Garage");
    expect(screen.getByRole("status")).toHaveTextContent("Link copied");
  });

  it("says so when the copy fails", async () => {
    shareLink.mockResolvedValueOnce("failed");
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Share this car" }));
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy the link");
  });

  it("says nothing when the share sheet is dismissed or used", async () => {
    const { user } = setup();
    for (const result of ["cancelled", "shared"]) {
      shareLink.mockResolvedValueOnce(result);
      await user.click(screen.getByRole("button", { name: "Share this car" }));
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    }
  });

  it("clears the confirmation after a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    shareLink.mockResolvedValue("copied");
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Share this car" }));
    expect(screen.getByRole("status")).toHaveTextContent("Link copied");
    act(() => { vi.advanceTimersByTime(2500); });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    vi.useRealTimers();
  });
});
