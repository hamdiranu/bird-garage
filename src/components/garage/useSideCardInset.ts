import { useLayoutEffect, useState, type RefObject } from "react";

/** In focus view the cards slide away, leaving room only for the edge tabs. */
const FOCUS_INSET = 44;

/** How far the side cards reach into the full-bleed stage (in pixels from each edge), so the camera frames the
    car between them. 0 below the large breakpoint, where the stage is a grid cell of its own. */
export function useSideCardInset(
  main: RefObject<HTMLElement | null>,
  left: RefObject<HTMLElement | null>,
  right: RefObject<HTMLElement | null>,
  isLg: boolean,
  focus: boolean,
) {
  const [inset, setInset] = useState(0);
  useLayoutEffect(() => {
    const m = main.current, l = left.current, r = right.current;
    if (!m || !l || !r) return;
    const measure = () => {
      if (!isLg) setInset(0);
      else if (focus) setInset(FOCUS_INSET);
      else setInset(Math.max(l.offsetLeft + l.offsetWidth, m.clientWidth - r.offsetLeft) + 6);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(m);
    return () => ro.disconnect();
  }, [main, left, right, isLg, focus]);
  return inset;
}
