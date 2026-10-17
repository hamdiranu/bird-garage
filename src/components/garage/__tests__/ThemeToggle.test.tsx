import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUI } from "@/testing/render";
import { ThemeToggle } from "../ThemeToggle";

describe("ThemeToggle", () => {
  it("offers the other theme", async () => {
    const onToggle = vi.fn();
    const { user } = renderUI(<ThemeToggle theme="dark" onToggle={onToggle} />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });
    await user.click(button);
    expect(onToggle).toHaveBeenCalled();
  });

  it("says it's in light mode when it is", () => {
    renderUI(<ThemeToggle theme="light" onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveAttribute("title", "Dark mode");
  });
});
