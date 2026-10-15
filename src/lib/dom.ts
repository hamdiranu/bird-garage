/* Small browser helpers. */

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Scroll a horizontal strip so `item` sits in its middle. */
export function scrollToCentre(strip: HTMLElement, item: HTMLElement, smooth: boolean) {
  strip.scrollTo({ left: item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2, behavior: smooth ? "smooth" : "auto" });
}
