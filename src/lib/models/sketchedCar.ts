import * as THREE from "three";
import type { Car } from "@/types/fleet";
import { getMaterials, paintMaterial } from "./materials";
import type { BuiltCar } from "./types";

/* A simplified 3D car for cars without a scan: the side outline extruded into a bevelled body, with glass,
   wheels, lamps, grille, plates, mirrors and roof sign added from the profile. The car faces +x. */

type P2 = number[];

function shapeFrom(pts: P2[], L: number) {
  const s = new THREE.Shape();
  pts.forEach((q, i) => { const x = L / 2 - q[0]; if (i) s.lineTo(x, q[1]); else s.moveTo(x, q[1]); });
  return s;
}

/** An outline extruded to `width`, bevelled by `t` deep and `s` wide. */
function slab(pts: P2[], L: number, width: number, t: number, s: number, mat: THREE.Material) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts, L), {
    depth: width - 2 * t, bevelEnabled: true, bevelThickness: t, bevelSize: s, bevelOffset: -s,
    bevelSegments: 3, curveSegments: 1, steps: 1,
  });
  geo.translate(0, 0, -(width - 2 * t) / 2);
  return new THREE.Mesh(geo, mat);
}

function quad(a: number[], b: number[], c: number[], d: number[], mat: THREE.Material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

/** A cylinder lying along z (wheel axis). */
function cylinder(R: number, h: number, seg: number) {
  const c = new THREE.CylinderGeometry(R, R, h, seg);
  c.rotateX(Math.PI / 2);
  return c;
}

/** Tyre, rim, hub and five bolts; `side` is +1 or -1 for which way the hub faces. */
function wheel(r: number, tw: number, side: number) {
  const M = getMaterials();
  const g = new THREE.Group();
  g.name = "wheel";
  g.add(new THREE.Mesh(cylinder(r, tw, 32), M.rubber));
  g.add(new THREE.Mesh(cylinder(r * 0.66, tw + 0.014, 28), M.rim));
  const hub = new THREE.Mesh(cylinder(r * 0.2, 0.02, 16), M.dark);
  hub.position.z = side * (tw / 2 + 0.012);
  g.add(hub);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2, bolt = new THREE.Mesh(cylinder(r * 0.12, 0.012, 12), M.dark);
    bolt.position.set(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, side * (tw / 2 + 0.007));
    g.add(bolt);
  }
  return g;
}

const cache: Record<string, BuiltCar> = {};

export function buildSketchedCar(car: Car): BuiltCar {
  if (cache[car.id]) return cache[car.id];
  const M = getMaterials();
  const p = car.profile, ol = car.outline, L = p.L, Wd = p.W, Wg = Wd * p.tumble, g = new THREE.Group(), paint = paintMaterial(car.paint);
  const X = (x: number) => L / 2 - x;
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
  };
  const box = (sx: number, sy: number, sz: number, mat: THREE.Material, x: number, y: number, z: number) =>
    add(new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z);
  const sides = [1, -1];

  // body, glasshouse and the dark underbody between the wheels
  g.add(slab(ol.body, L, Wd, 0.07, 0.05, paint));
  g.add(slab(ol.green, L, Wg, 0.06, 0.035, paint));
  const ux0 = ol.axF - ol.ra + 0.03, ux1 = ol.axR + ol.ra - 0.03, uy0 = p.gc + 0.03, uy1 = 2 * p.wr + 0.03;
  box(ux1 - ux0, uy1 - uy0, Wd - 0.5, M.dark, X((ux0 + ux1) / 2), (uy0 + uy1) / 2, 0);

  // side windows, windscreen and rear window
  ol.panes.forEach((pl) => {
    const geo = new THREE.ShapeGeometry(shapeFrom(pl, L));
    sides.forEach((s) => add(geo, M.glass, 0, 0, s * (Wg / 2 + 0.004)));
  });
  const gr = ol.greenRaw;
  const edgeGlass = (a: P2, b: P2, i0: number, i1: number, zh: number) => {
    const ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey), nx = -ey / len, ny = ex / len;
    const t0 = i0 / len, t1 = 1 - i1 / len;
    if (t1 < t0 + 0.08) return;
    const P = (t: number) => [a[0] + ex * t + nx * 0.008, a[1] + ey * t + ny * 0.008];
    const A = P(t0), B = P(t1);
    g.add(quad([X(A[0]), A[1], zh], [X(B[0]), B[1], zh], [X(B[0]), B[1], -zh], [X(A[0]), A[1], -zh], M.glass));
  };
  edgeGlass(gr[0], gr[1], 0.11, 0.19, Wg / 2 - 0.09);
  edgeGlass(gr[2], gr[3], 0.19, 0.11, Wg / 2 - 0.09);

  // headlamps, grille and tail lamps, following the slope of the nose and tail
  const noseAt = (y: number) => p.noseX * Math.max(0, Math.min(1, (y - (p.gc + 0.25)) / (p.hoodH - p.gc - 0.25)));
  const tailAt = (y: number) => L - 0.035 * Math.max(0, Math.min(1, (y - (p.gc + 0.27)) / (p.tailH - p.gc - 0.27)));
  const hy = p.hoodH - p.hlDrop, round = p.hl === "round", hz = round ? Wd / 2 - 0.2 : Wd / 2 - 0.09 - (p.hl as number[])[1] / 2;
  sides.forEach((s) => {
    if (round) {
      const c = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 20);
      c.rotateZ(Math.PI / 2);
      add(c, M.head, X(noseAt(hy) - 0.002), hy, s * hz);
    } else {
      const hl = p.hl as number[];
      box(0.07, hl[0], hl[1], M.head, X(noseAt(hy) + 0.012), hy, s * hz);
    }
  });
  if (p.gr) {
    const gy = p.gc + 0.25 + (p.hoodH - p.gc - 0.25) * (round ? 0.72 : 0.45);
    box(0.05, p.gr[0], p.gr[1], M.grille, X(noseAt(gy) + 0.008), gy, 0);
  }
  if (p.tail === "bar") {
    const y1 = p.tailH - 0.13;
    box(0.06, 0.055, Wd - 0.24, M.tail, X(tailAt(y1) - 0.012), y1, 0);
  } else if (p.tail === "h") {
    const y2 = p.tailH - 0.15;
    sides.forEach((s) => box(0.06, 0.1, 0.34, M.tail, X(tailAt(y2) - 0.012), y2, s * (Wd / 2 - 0.26)));
  } else {
    const th = p.bus ? 0.7 : 0.34, y3 = p.tailH - (p.bus ? 0.65 : 0.2);
    sides.forEach((s) => box(0.06, th, 0.12, M.tail, X(tailAt(y3) - 0.012), y3, s * (Wd / 2 - 0.15)));
  }

  // number plates
  const plate = car.plate === "yellow" ? M.plateY : M.plateW;
  box(0.02, 0.13, 0.43, plate, X(-0.01), p.gc + 0.33, 0);
  box(0.02, 0.13, 0.43, plate, X(L + 0.01), p.gc + (p.bus ? 0.62 : 0.5), 0);

  // mirrors (a bus's hang off the front corners and it carries a roof pod), roof sign and extras
  if (p.bus) {
    sides.forEach((s) => {
      box(0.1, 0.44, 0.16, M.dark, X(0), p.H - 1.05, s * (Wd / 2 + 0.17));
      box(0.05, 0.05, 0.26, M.dark, X(0.05), p.H - 0.8, s * (Wd / 2 + 0.06));
    });
    box(2.6, 0.2, 1.7, M.pod, X(L * 0.52), p.H + 0.09, 0);
  } else {
    sides.forEach((s) => box(0.15, 0.1, 0.17, paint, X(p.cowlX + 0.16), p.cowlH + 0.07, s * (Wg / 2 + 0.07)));
  }
  if (car.sign) {
    const sx = p.roofX0 + (p.roofX1 - p.roofX0) * 0.22;
    box(0.22, 0.035, 0.5, M.dark, X(sx), p.H + 0.012, 0);
    box(0.15, 0.11, 0.44, car.sign === "silver" ? M.signS : M.signB, X(sx), p.H + 0.08, 0);
  }
  if (p.rails) sides.forEach((s) => box(p.roofX1 - p.roofX0 - 0.5, 0.035, 0.04, M.dark, X((p.roofX0 + p.roofX1) / 2), p.H + 0.02, s * (Wg / 2 - 0.14)));
  if (p.clad) box(ol.axR - ol.axF - 2 * ol.ra + 0.1, 0.16, Wd + 0.02, M.dark, X((ol.axF + ol.axR) / 2), p.gc + 0.09, 0);
  if (p.chrome) {
    box(0.09, 0.09, Wd + 0.04, M.chrome, X(-0.02), p.gc + 0.2, 0);
    box(0.09, 0.09, Wd + 0.04, M.chrome, X(L + 0.02), p.gc + 0.2, 0);
  }

  [ol.axF, ol.axR].forEach((ax) => sides.forEach((s) => {
    const w = wheel(p.wr, p.tw, s);
    w.position.set(X(ax), p.wr, s * (Wd / 2 - p.tw / 2 + 0.004));
    g.add(w);
  }));

  const wheels: THREE.Object3D[] = [];
  g.traverse((n) => { if (n.name === "wheel") wheels.push(n); });
  g.updateMatrixWorld(true);
  return (cache[car.id] = { root: g, wheels, height: new THREE.Box3().setFromObject(g).max.y });
}
