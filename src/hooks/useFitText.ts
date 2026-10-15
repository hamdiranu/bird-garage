import { useCallback, useEffect, useLayoutEffect, type RefObject } from "react";

/** Shrink an element's font, 2px at a time, until its text fits its width without overflowing. Refits when
    `content` changes, when the window resizes, and once the web fonts have loaded. */
export function useFitText(ref: RefObject<HTMLElement | null>, content: unknown, minPx = 20) {
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = "";
    let px = parseFloat(getComputedStyle(el).fontSize) || 48;
    while (el.scrollWidth > el.clientWidth + 1 && px > minPx) {
      px -= 2;
      el.style.fontSize = px + "px";
    }
  }, [ref, minPx]);

  useLayoutEffect(fit, [content, fit]);
  useEffect(() => {
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);
}
