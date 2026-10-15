import { useEffect, useState, type RefObject } from "react";

/** An element's content-box size, updated as it resizes. Starts at `initial` until first measured. */
export function useElementSize(ref: RefObject<HTMLElement | null>, initial = { width: 400, height: 300 }) {
  const [size, setSize] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
