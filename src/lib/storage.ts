/* What the garage remembers between visits, in localStorage. Storage can be missing or full (private
   browsing, blocked cookies), so reads fall back to nothing and writes are best effort. */

const KEY = "bluebird-fleet-select";

export interface SavedGarage {
  /** The car the visitor selected. */
  pick?: string;
  /** The car they were looking at last. */
  last?: string;
  /** Auto-spin, when they turned it off. */
  spin?: boolean;
  /** Showroom mode (touring the cars when nobody is using the screen). */
  showroom?: boolean;
}

export function loadGarage(): SavedGarage {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      pick: typeof saved.pick === "string" ? saved.pick : undefined,
      last: typeof saved.last === "string" ? saved.last : undefined,
      spin: typeof saved.spin === "boolean" ? saved.spin : undefined,
      showroom: typeof saved.showroom === "boolean" ? saved.showroom : undefined,
    };
  } catch {
    return {};
  }
}

export function saveGarage(state: { pick: string | null; last: string; spin: boolean; showroom: boolean }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
