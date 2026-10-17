/* How far each car's model has downloaded, for the loading ring on the stage. This module has no three.js in it,
   so the page can watch it without pulling the 3D code into its first bundle. */

/** Car id → share downloaded (0–1), or NaN while the size is unknown. A car is listed only while it loads. */
const progress = new Map<string, number>();
const listeners = new Set<() => void>();
/** Bumped on every change, so snapshots of the map compare cheaply. */
let version = 0;

export function setLoadProgress(id: string, value: number | null) {
  if (value === null) progress.delete(id);
  else progress.set(id, value);
  version++;
  listeners.forEach((l) => l());
}

/** The car's download progress while it loads (NaN if the size is unknown), or null when it isn't loading. */
export function getLoadProgress(id: string): number | null {
  return progress.get(id) ?? null;
}

export function subscribeLoadProgress(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const loadProgressVersion = () => version;
