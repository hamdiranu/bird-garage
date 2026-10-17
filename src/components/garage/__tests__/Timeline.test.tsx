import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TIMELINE } from "@/data/timeline";
import { findCar } from "@/lib/fleet";
import { renderUI } from "@/testing/render";
import { Timeline } from "../Timeline";

// jsdom has <dialog> but not its modal methods.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); });
  HTMLElement.prototype.scrollTo = vi.fn();
});

function setup(open = true) {
  const props = { open, onClose: vi.fn(), current: findCar("limo"), onView: vi.fn(), reduceMotion: true };
  return { props, ...renderUI(<Timeline {...props} />) };
}

describe("Timeline", () => {
  it("opens as a modal dialog listing every milestone in order", () => {
    setup();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    const years = screen.getAllByRole("listitem").map((li) => li.querySelector("span + span")?.textContent);
    expect(years).toEqual(TIMELINE.map((m) => m.year));
  });

  it("stays closed until asked", () => {
    setup(false);
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it("marks the milestone of the car on stage, and scrolls to it", () => {
    setup();
    const here = screen.getAllByRole("listitem").find((li) => li.hasAttribute("data-current"));
    expect(here).toHaveTextContent("The Limo years");
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  it("puts a milestone's car on stage", async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole("button", { name: /view car · torana/i }));
    expect(props.onView).toHaveBeenCalledWith(findCar("torana"));
  });

  it("closes from its button, Esc (the dialog's close event) or the dimmed page", async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole("button", { name: "Close the timeline" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByRole("dialog", { hidden: true }), new Event("close"));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("dialog", { hidden: true }));
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });
});
