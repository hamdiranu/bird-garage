import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUI } from "@/testing/render";
import { SortMenu } from "../SortMenu";

describe("SortMenu", () => {
  it("opens a list of the orders, marking the current one", async () => {
    const { user } = renderUI(<SortMenu sort="rating" onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /sort the cars: top rated/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Fleet order", "Top rated", "Most seats", "Electric first"]);
    expect(screen.getByRole("option", { name: "Top rated" })).toHaveAttribute("aria-selected", "true");
  });

  it("picks an order and closes", async () => {
    const onChange = vi.fn();
    const { user } = renderUI(<SortMenu sort="fleet" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /sort the cars/i }));
    await user.click(screen.getByRole("button", { name: "Electric first" }));
    expect(onChange).toHaveBeenCalledWith("electric");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes on Esc and on a click outside", async () => {
    const { user } = renderUI(<SortMenu sort="fleet" onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /sort the cars/i });
    await user.click(button);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.click(button);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("speaks Indonesian", async () => {
    const { user } = renderUI(<SortMenu sort="fleet" onChange={() => {}} />, { lang: "id" });
    await user.click(screen.getByRole("button", { name: /urutkan mobil/i }));
    expect(screen.getByRole("option", { name: "Rating tertinggi" })).toBeInTheDocument();
  });
});
