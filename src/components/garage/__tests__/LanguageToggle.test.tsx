import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderUI } from "@/testing/render";
import { LanguageToggle } from "../LanguageToggle";

describe("LanguageToggle", () => {
  it("presses the current language and switches to the other", async () => {
    const { user } = renderUI(<LanguageToggle />);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Bahasa Indonesia" }));
    expect(screen.getByRole("button", { name: "Bahasa Indonesia" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: "Bahasa" })).toBeInTheDocument();
    expect(localStorage.getItem("bluebird-lang")).toBe("id");
    expect(document.documentElement.lang).toBe("id");
  });
});
