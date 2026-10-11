/* Builds a simplified 3D car by extruding the side profile. Colours go through three's
   colour management, so hex values are sRGB as written. */
import * as THREE from "three";
import type { Car } from "./fleet";

export function glowTex(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(0.35, outer); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let mats: ReturnType<typeof makeMats> | null = null;
function makeMats() {
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  return {
    glass: std({ color: "#0a1018", metalness: 0.9, roughness: 0.08, side: THREE.DoubleSide }),
    dark: std({ color: "#0b0d11", metalness: 0.2, roughness: 0.7 }),
    grille: std({ color: "#14171c", metalness: 0.85, roughness: 0.32 }),
    rubber: std({ color: "#0a0a0c", metalness: 0, roughness: 0.9 }),
    rim: std({ color: "#b9c0c9", metalness: 0.9, roughness: 0.3 }),
    chrome: std({ color: "#e6eaef", metalness: 1, roughness: 0.12 }),
    pod: std({ color: "#c9d0d8", metalness: 0.2, roughness: 0.6 }),
    // lamps and roof signs are unlit, with just enough emission to read as lenses
    head: std({ color: "#dfe6ee", emissive: "#fff0cc", emissiveIntensity: 0.12, roughness: 0.3 }),
    tail: std({ color: "#3a0508", emissive: "#ff1a2c", emissiveIntensity: 0.25, roughness: 0.4 }),
    signB: std({ color: "#cfe8ff", emissive: "#8fd0ff", emissiveIntensity: 0.2, roughness: 0.5 }),
    signS: std({ color: "#f1f4f7", emissive: "#f1f4f7", emissiveIntensity: 0.15, roughness: 0.5 }),
    plateY: std({ color: "#f5c518", roughness: 0.6 }),
    plateW: std({ color: "#f2f3f5", roughness: 0.6 }),
    paints: {} as Record<string, THREE.MeshPhysicalMaterial>,
  };
}
export function getMats() {
  return (mats ??= makeMats());
}

function paintMat(hex: string) {
  const M = getMats();
  return (M.paints[hex] ??= new THREE.MeshPhysicalMaterial({
    color: hex, metalness: 0.45, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.16,
  }));
}

type P2 = number[];

function shapeFrom(pts: P2[], L: number) {
  const s = new THREE.Shape();
  pts.forEach((q, i) => { const x = L / 2 - q[0]; if (i) s.lineTo(x, q[1]); else s.moveTo(x, q[1]); });
  return s;
}
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
function cyl(R: number, h: number, seg: number) {
  const c = new THREE.CylinderGeometry(R, R, h, seg);
  c.rotateX(Math.PI / 2);
  return c;
}
function wheel(r: number, tw: number, s: number) {
  const M = getMats();
  const g = new THREE.Group();
  g.name = "wheel";
  g.add(new THREE.Mesh(cyl(r, tw, 32), M.rubber));
  g.add(new THREE.Mesh(cyl(r * 0.66, tw + 0.014, 28), M.rim));
  const hub = new THREE.Mesh(cyl(r * 0.2, 0.02, 16), M.dark);
  hub.position.z = s * (tw / 2 + 0.012);
  g.add(hub);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2, h = new THREE.Mesh(cyl(r * 0.12, 0.012, 12), M.dark);
    h.position.set(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, s * (tw / 2 + 0.007));
    g.add(h);
  }
  return g;
}

export interface BuiltCar {
  /** The whole car; slide this for the roll-in. Clone it to show the car in a second scene. */
  root: THREE.Group;
  wheels: THREE.Object3D[];
  /** Highest point above the ground in metres (roof sign, open doors and all), for camera framing. */
  height: number;
}

const cache: Record<string, BuiltCar> = {};

/** The car's 3D model: the scanned GLB when it has one, otherwise the extruded profile sketch. */
export function loadCar(car: Car): Promise<BuiltCar> {
  if (!car.glb) return Promise.resolve(buildCar(car));
  return import("./glbCar").then((m) => m.loadGlbCar(car));
}

export function buildCar(car: Car): BuiltCar {
  if (cache[car.id]) return cache[car.id];
  const M = getMats();
  const p = car.p, pr = car.prof, L = p.L, Wd = p.W, Wg = Wd * p.tumble, g = new THREE.Group(), paint = paintMat(car.paint);
  const X = (x: number) => L / 2 - x;
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
  };
  const box = (sx: number, sy: number, sz: number, mat: THREE.Material, x: number, y: number, z: number) =>
    add(new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z);
  const sides = [1, -1];

  g.add(slab(pr.body, L, Wd, 0.07, 0.05, paint));
  g.add(slab(pr.green, L, Wg, 0.06, 0.035, paint));
  const ux0 = pr.axF - pr.ra + 0.03, ux1 = pr.axR + pr.ra - 0.03, uy0 = p.gc + 0.03, uy1 = 2 * p.wr + 0.03;
  box(ux1 - ux0, uy1 - uy0, Wd - 0.5, M.dark, X((ux0 + ux1) / 2), (uy0 + uy1) / 2, 0);

  pr.panes.forEach((pl) => {
    const geo = new THREE.ShapeGeometry(shapeFrom(pl, L));
    sides.forEach((s) => add(geo, M.glass, 0, 0, s * (Wg / 2 + 0.004)));
  });
  const gr = pr.greenRaw;
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

  const plate = car.plate === "yellow" ? M.plateY : M.plateW;
  box(0.02, 0.13, 0.43, plate, X(-0.01), p.gc + 0.33, 0);
  box(0.02, 0.13, 0.43, plate, X(L + 0.01), p.gc + (p.bus ? 0.62 : 0.5), 0);

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
  if (p.clad) box(pr.axR - pr.axF - 2 * pr.ra + 0.1, 0.16, Wd + 0.02, M.dark, X((pr.axF + pr.axR) / 2), p.gc + 0.09, 0);
  if (p.chrome) {
    box(0.09, 0.09, Wd + 0.04, M.chrome, X(-0.02), p.gc + 0.2, 0);
    box(0.09, 0.09, Wd + 0.04, M.chrome, X(L + 0.02), p.gc + 0.2, 0);
  }

  [pr.axF, pr.axR].forEach((ax) => sides.forEach((s) => {
    const w = wheel(p.wr, p.tw, s);
    w.position.set(X(ax), p.wr, s * (Wd / 2 - p.tw / 2 + 0.004));
    g.add(w);
  }));

  const wheels: THREE.Object3D[] = [];
  g.traverse((n) => { if (n.name === "wheel") wheels.push(n); });
  g.updateMatrixWorld(true);
  return (cache[car.id] = { root: g, wheels, height: new THREE.Box3().setFromObject(g).max.y });
}
