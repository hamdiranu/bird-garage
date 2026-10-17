import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FILTERS, SERVICES } from "@/data/services";
import { renderUI } from "@/testing/render";
import { FilterPills } from "../FilterPills";

describe("FilterPills", () => {
  it("has one pill per service plus All, with the active one pressed", () => {
    HTMLElement.prototype.scrollTo = vi.fn();
    renderUI(<FilterPills filter="heritage" onChange={() => {}} reduceMotion />);
    const pills = screen.getAllByRole("button");
    expect(pills).toHaveLength(FILTERS.length);
    expect(screen.getByRole("button", { name: /heritage/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("explains each service in its tooltip", () => {
    HTMLElement.prototype.scrollTo = vi.fn();
    renderUI(<FilterPills filter="all" onChange={() => {}} reduceMotion />);
    expect(screen.getByRole("button", { name: /goldenbird/i })).toHaveAttribute("title", `Goldenbird · ${(SERVICES.goldenbird.role as { en: string }).en}`);
  });

  it("filters on click", async () => {
    HTMLElement.prototype.scrollTo = vi.fn();
    const onChange = vi.fn();
    const { user } = renderUI(<FilterPills filter="all" onChange={onChange} reduceMotion />);
    await user.click(screen.getByRole("button", { name: /cititrans/i }));
    expect(onChange).toHaveBeenCalledWith("cititrans");
  });
});
