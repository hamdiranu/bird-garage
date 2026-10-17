import { useEffect, useRef } from "react";

/** While `open`, call `close` on Esc or on a pointer press outside the element `inside()` returns (a menu, a list,
    a hotspot's note). Listeners are attached only while open. */
export function useDismiss(open: boolean, inside: () => Element | null | undefined, close: () => void) {
  const latest = useRef({ inside, close });
  useEffect(() => { latest.current = { inside, close }; });

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!latest.current.inside()?.contains(e.target as Node)) latest.current.close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") latest.current.close(); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
}
