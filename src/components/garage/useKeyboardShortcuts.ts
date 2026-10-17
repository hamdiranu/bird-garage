import { useEffect, useRef } from "react";

export interface Shortcuts {
  prev: () => void;
  next: () => void;
  togglePick: () => void;
  toggleCompare: () => void;
  toggleHotspots: () => void;
  /** Focus view; left out where the screen is too narrow for it. */
  toggleFocus?: () => void;
  exitFocus: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

/** ← → change car, Enter picks it, C toggles compare mode, H the hotspots, F focus view, Esc leaves it, + − 0 zoom.
    (The menu closes itself on Esc.) Keys with Alt, Ctrl or ⌘ are left to the browser, Enter on a button presses
    that button, and nothing fires while a dialog (the timeline) is open. */
export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  // The listener is added once and always calls the latest handlers.
  const latest = useRef(shortcuts);
  useEffect(() => { latest.current = shortcuts; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
      const keys = latest.current;
      const onButton = document.activeElement?.tagName === "BUTTON";
      switch (e.key) {
        case "ArrowRight": keys.next(); e.preventDefault(); break;
        case "ArrowLeft": keys.prev(); e.preventDefault(); break;
        case "Enter": if (!onButton) { keys.togglePick(); e.preventDefault(); } break;
        case "c": case "C": keys.toggleCompare(); break;
        case "h": case "H": keys.toggleHotspots(); break;
        case "f": case "F": keys.toggleFocus?.(); break;
        case "Escape": keys.exitFocus(); break;
        case "+": case "=": keys.zoomIn(); break;
        case "-": case "_": keys.zoomOut(); break;
        case "0": keys.resetZoom(); break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
