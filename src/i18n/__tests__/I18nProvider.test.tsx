import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider, useI18n } from "../I18nProvider";

const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;

describe("I18nProvider", () => {
  it("starts in the saved language", () => {
    localStorage.setItem("bluebird-lang", "id");
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.lang).toBe("id");
    expect(result.current.t.filter.all).toBe("Semua");
    expect(document.documentElement.lang).toBe("id");
  });

  it("switches language, and remembers it", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.setLang("id"));
    expect(result.current.t.ratings.select).toBe("Pilih mobil ini");
    expect(localStorage.getItem("bluebird-lang")).toBe("id");
    act(() => result.current.setLang("en"));
    expect(result.current.t.ratings.select).toBe("Select this car");
  });

  it("localizes data text and numbers", () => {
    localStorage.setItem("bluebird-lang", "id");
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.text({ en: "Petrol", id: "Bensin" })).toBe("Bensin");
    expect(result.current.text("Sedan")).toBe("Sedan");
    expect(result.current.number(4.39, { max: 2 })).toBe("4,39");
  });

  it("renders its children", () => {
    render(<I18nProvider><p>inside</p></I18nProvider>);
    expect(screen.getByText("inside")).toBeInTheDocument();
  });
});

describe("useI18n", () => {
  it("throws outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useI18n())).toThrow(/inside <I18nProvider>/);
  });
});
