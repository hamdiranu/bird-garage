/* Camera presets and zoom limits, shared by the toolbar, the keyboard shortcuts and the page. */

/** Turntable angle for each preset view. */
export const VIEWS = { front: -Math.PI / 2, side: 0, rear: Math.PI / 2 } as const;
export type ViewKey = keyof typeof VIEWS;

/** Zoom over the fitted view: its range, and the factor per button press or key. */
export const ZOOM = { min: 0.75, max: 2.5, step: 1.25 };

export const clampZoom = (z: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, z));

/** The turn from `yaw` to `target` the short way round, in [-π, π). */
export function shortestTurn(yaw: number, target: number) {
  const full = 2 * Math.PI;
  return ((((target - yaw + Math.PI) % full) + full) % full) - Math.PI;
}
