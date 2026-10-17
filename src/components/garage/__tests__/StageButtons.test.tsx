import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUI } from "@/testing/render";
import { EdgeHandle, FocusButton, NavButton } from "../StageButtons";

describe("NavButton", () => {
  it("steps to the previous or next car", async () => {
    const prev = vi.fn(), next = vi.fn();
    const { user } = renderUI(<><NavButton dir="prev" onClick={prev} /><NavButton dir="next" onClick={next} /></>);
    await user.click(screen.getByRole("button", { name: "Previous car" }));
    await user.click(screen.getByRole("button", { name: "Next car" }));
    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("FocusButton", () => {
  it("names what it will do next", () => {
    renderUI(<><FocusButton focused={false} onClick={() => {}} /><FocusButton focused onClick={() => {}} /></>);
    expect(screen.getByRole("button", { name: "Focus on the car" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Show the info panels" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("EdgeHandle", () => {
  it("brings the panels back", async () => {
    const onClick = vi.fn();
    const { user } = renderUI(<EdgeHandle side="left" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Show the info panels" }));
    expect(onClick).toHaveBeenCalled();
  });
});
