import type { Outline, ProfileParams, RoundedPoint } from "@/types/fleet";

/* Turns a car's side profile into polygons, in metres: the body, the glasshouse and its window panes.
   The sketched 3D model extrudes them and the 2D side view draws them. */

type Point = [number, number];

/** Replace each point that carries a radius with a quadratic-bezier fillet. */
function roundPoints(pts: RoundedPoint[]): Point[] {
  const out: Point[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], r = p1[2] || 0;
    if (!r) { out.push([p1[0], p1[1]]); continue; }
    const d1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const c = Math.min(r, d1 * 0.45, d2 * 0.45);
    const a = [p1[0] + ((p0[0] - p1[0]) / d1) * c, p1[1] + ((p0[1] - p1[1]) / d1) * c];
    const b = [p1[0] + ((p2[0] - p1[0]) / d2) * c, p1[1] + ((p2[1] - p1[1]) / d2) * c];
    for (let k = 0; k <= 7; k++) {
      const t = k / 7, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * p1[0] + t * t * b[0], u * u * a[1] + 2 * u * t * p1[1] + t * t * b[1]]);
    }
  }
  const clean: Point[] = [];
  out.forEach((q) => {
    const l = clean[clean.length - 1];
    if (!l || Math.hypot(l[0] - q[0], l[1] - q[1]) > 1e-4) clean.push(q);
  });
  const f = clean[0], l = clean[clean.length - 1];
  if (Math.hypot(l[0] - f[0], l[1] - f[1]) < 1e-4) clean.pop();
  return clean;
}

/** Shrink a convex polygon by `m` on every side. */
function insetConvex(poly: (Point | RoundedPoint)[], m: number): Point[] {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const s = area > 0 ? 1 : -1;
  const lines: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
    lines.push([a[0] - (ey / len) * s * m, a[1] + (ex / len) * s * m, ex, ey]);
  }
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const A = lines[(i + n - 1) % n], B = lines[i], den = A[2] * B[3] - A[3] * B[2];
    const t = ((B[0] - A[0]) * B[3] - (B[1] - A[1]) * B[2]) / den;
    out.push([A[0] + A[2] * t, A[1] + A[3] * t]);
  }
  return out;
}

/** Clip a polygon to one side of the line pts[axis] = c: at or above c when `keepAbove`, else at or below. */
function clip(pts: Point[], axis: 0 | 1, keepAbove: boolean, c: number): Point[] {
  const o: Point[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const ia = keepAbove ? a[axis] >= c : a[axis] <= c, ib = keepAbove ? b[axis] >= c : b[axis] <= c;
    if (ia) o.push(a);
    if (ia !== ib) { const t = (c - a[axis]) / (b[axis] - a[axis]); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return o;
}

export function makeOutline(p: ProfileParams): Outline {
  const L = p.L, H = p.H, gc = p.gc, wr = p.wr, ra = wr + 0.055, dy = wr - gc, axF = p.fo, axR = p.fo + p.wb;
  const a0 = -Math.asin(dy / ra);
  const arch = (ax: number): RoundedPoint[] => {
    const o: RoundedPoint[] = [];
    for (let k = 0; k <= 14; k++) { const a = a0 + ((Math.PI - 2 * a0) * k) / 14; o.push([ax + ra * Math.cos(a), wr + ra * Math.sin(a), 0]); }
    return o;
  };
  const body: RoundedPoint[] = [
    [0.17, gc, 0.08], [0, gc + 0.25, 0.09], [p.noseX, p.hoodH, p.noseR], [p.cowlX, p.cowlH, 0.05],
    [p.rearX, p.rearH, 0.05], [L - 0.035, p.tailH, p.tailR], [L, gc + 0.27, 0.09], [L - 0.17, gc, 0.08],
    ...arch(axR), ...arch(axF),
  ];
  const greenRaw: RoundedPoint[] = [
    [p.cowlX - 0.06, p.cowlH - 0.05, 0], [p.roofX0, H, 0.14], [p.roofX1, H - p.drop, 0.14], [p.rearX + 0.04, p.rearH - 0.05, 0],
  ];
  let inner = insetConvex(greenRaw, 0.09);
  if (p.winTop) inner = clip(inner, 1, false, p.winTop);
  const xs = inner.map((q) => q[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const n = p.panes, gap = p.bus ? 0.05 : 0.06, panes: Point[][] = [];
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n + (i ? gap / 2 : 0);
    const xb = x0 + ((x1 - x0) * (i + 1)) / n - (i < n - 1 ? gap / 2 : 0);
    const pane = clip(clip(inner, 0, true, xa), 0, false, xb);
    if (pane.length >= 3) panes.push(pane);
  }
  return { body: roundPoints(body), green: roundPoints(greenRaw), greenRaw, panes, axF, axR, ra };
}
