/* Fleet data and the side-profile geometry shared by the 3D models and the 2D thumbnails. */

export type ClassKey = "bluebird" | "silverbird" | "goldenbird" | "bigbird" | "cititrans" | "heritage";
export type FilterKey = "all" | ClassKey;
export type StatKey = "cap" | "comfort" | "eco" | "agile";

export const CLASSES: Record<ClassKey, { name: string; role: string; accent: string }> = {
  bluebird: { name: "Bluebird", role: "Regular taxi", accent: "#5db4ff" },
  silverbird: { name: "Silverbird", role: "Executive taxi", accent: "#d5dde8" },
  goldenbird: { name: "Goldenbird", role: "Car rental", accent: "#e2bb63" },
  bigbird: { name: "Bigbird", role: "Charter", accent: "#43d3c4" },
  cititrans: { name: "Cititrans", role: "Intercity shuttle", accent: "#ff8a5c" },
  heritage: { name: "Heritage", role: "Retired", accent: "#f0dfb8" },
};

export const ORDER: FilterKey[] = ["all", "bluebird", "silverbird", "goldenbird", "bigbird", "cititrans", "heritage"];
export const STATS: [StatKey, string][] = [
  ["cap", "Seats"],
  ["comfort", "Comfort"],
  ["eco", "Eco"],
  ["agile", "City agility"],
];

/** Side-profile parameters in metres, x measured from the front bumper. */
export interface Params {
  L: number; W: number; H: number; wb: number; fo: number; wr: number; gc: number; tw: number;
  hoodH: number; cowlX: number; cowlH: number; roofX0: number; roofX1: number; drop: number;
  rearX: number; rearH: number; tailH: number; tumble: number; panes: number;
  tail: "v" | "bar" | "h"; noseX: number; noseR: number; tailR: number;
  hl: [number, number] | "round"; hlDrop: number; gr: [number, number] | 0;
  winTop?: number; bus?: 1; rails?: 1; clad?: 1; chrome?: 1;
}
type Pt = [number, number];
type RPt = [number, number, number];

export interface Profile {
  body: Pt[]; green: Pt[]; greenRaw: RPt[]; panes: Pt[][]; axF: number; axR: number; ra: number;
}

export interface Car {
  id: string; cls: ClassKey; maker: string; model: string; short: string; paint: string;
  plate: "yellow" | "white"; sign?: "blue" | "silver"; blurb: string; body: string; seats: string;
  power: string; note: string; r: Record<StatKey, number>; p: Params; prof: Profile;
  /** Scanned 3D model to show instead of the extruded profile sketch. */
  glb?: string;
  /** Turn (radians, about the vertical) that points the scan's nose to +x. Default π, for a nose at -x
      (Meshy exports); π/2 for a nose at +z (Tripo exports). */
  glbYaw?: number;
  /** Roof height and half body width in the scan's own units, for scans the loader can't measure itself
      (e.g. doors modelled open, which would read as roof and body). */
  glbFit?: { roof: number; halfWidth: number };
}

const BLUE = "#2a86d6";
const D: Partial<Params> = {
  gc: 0.2, wr: 0.33, tw: 0.21, tumble: 0.9, panes: 3, drop: 0.05, tail: "v", noseX: 0.03,
  noseR: 0.13, tailR: 0.1, hl: [0.1, 0.34], hlDrop: 0.17, gr: [0.16, 0.7],
};

type RawCar = Omit<Car, "p" | "prof"> & { p: Partial<Params> };

const RAW: RawCar[] = [
  { id: "transmover", cls: "bluebird", maker: "Toyota", model: "Transmover", short: "Transmover", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "Toyota's taxi-only MPV, built on the Avanza. It comes first whenever Bluebird lists its regular fleet.",
    body: "Compact MPV", seats: "7", power: "Petrol", note: "Named in the 2025 fleet line-up",
    r: { cap: 6, comfort: 5, eco: 5, agile: 8 },
    p: { L: 4.4, W: 1.73, H: 1.7, wb: 2.75, fo: 0.83, wr: 0.32, hoodH: 0.97, cowlX: 1.0, cowlH: 1.06, roofX0: 1.72, roofX1: 4.02, rearX: 4.3, rearH: 1.08, tailH: 1.05, tumble: 0.92 } },
  { id: "mobilio", cls: "bluebird", maker: "Honda", model: "Mobilio", short: "Mobilio", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "Honda's low-roof seven-seater in Bluebird blue. It shares regular taxi duty with the Transmover.",
    body: "Compact MPV", seats: "7", power: "Petrol", note: "Named in the 2025 fleet line-up",
    r: { cap: 6, comfort: 5, eco: 6, agile: 8 },
    p: { L: 4.39, W: 1.68, H: 1.6, wb: 2.65, fo: 0.86, wr: 0.31, hoodH: 0.9, cowlX: 0.98, cowlH: 1.0, roofX0: 1.78, roofX1: 3.98, drop: 0.07, rearX: 4.28, rearH: 1.06, tailH: 1.03, tumble: 0.91 } },
  { id: "brv", cls: "bluebird", maker: "Honda", model: "BR-V", short: "BR-V", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "Honda's seven-seat crossover, with a little more ground clearance than the MPVs it works alongside.",
    body: "Crossover MPV", seats: "7", power: "Petrol", note: "Pictured in Bluebird livery",
    r: { cap: 6, comfort: 6, eco: 5, agile: 7 },
    p: { L: 4.49, W: 1.78, H: 1.69, wb: 2.7, fo: 0.9, wr: 0.35, gc: 0.24, hoodH: 1.03, cowlX: 1.1, cowlH: 1.11, roofX0: 1.86, roofX1: 4.1, rearX: 4.38, rearH: 1.13, tailH: 1.1, tumble: 0.91, rails: 1, clad: 1 } },
  { id: "e6", cls: "bluebird", maker: "BYD", model: "e6", short: "BYD e6", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "Indonesia's first electric taxi. 25 of them started carrying passengers on 1 May 2019, and a second-generation e6 followed in 2024.",
    body: "Electric MPV", seats: "5", power: "Electric", note: "On the road since 2019",
    r: { cap: 4, comfort: 6, eco: 10, agile: 7 },
    p: { L: 4.7, W: 1.81, H: 1.67, wb: 2.8, fo: 0.93, wr: 0.34, hoodH: 0.93, noseX: 0.06, cowlX: 1.02, cowlH: 1.04, roofX0: 1.92, roofX1: 4.15, drop: 0.09, rearX: 4.58, rearH: 1.1, tailH: 1.06, tail: "bar", gr: 0, hl: [0.07, 0.42] } },
  { id: "m6", cls: "bluebird", maker: "BYD", model: "M6", short: "BYD M6", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "A three-row electric MPV. Bluebird named it in its fleet line-up for the group's 53rd anniversary.",
    body: "Electric MPV", seats: "6 or 7", power: "Electric", note: "Named in the 2025 fleet line-up",
    r: { cap: 6, comfort: 7, eco: 10, agile: 6 },
    p: { L: 4.71, W: 1.81, H: 1.69, wb: 2.8, fo: 0.93, wr: 0.34, hoodH: 0.96, noseX: 0.05, cowlX: 0.98, cowlH: 1.06, roofX0: 1.8, roofX1: 4.32, drop: 0.06, rearX: 4.61, rearH: 1.1, tailH: 1.07, tumble: 0.92, tail: "bar", gr: 0, hl: [0.07, 0.42] } },
  { id: "e6-prime", cls: "bluebird", maker: "BYD", model: "e6 Prime", short: "e6 Prime", paint: "#1fa6dc", plate: "yellow", sign: "blue",
    blurb: "The second-generation e6 in Bluebird Prime livery. Prime launched in July 2026 as a tier between regular taxis and Silverbird, and runs the e6 in Jakarta, Bandung, Surabaya, Medan and Bali.",
    body: "Electric MPV", seats: "5", power: "Electric", note: "Bluebird Prime, July 2026",
    r: { cap: 5, comfort: 8, eco: 10, agile: 7 },
    glb: "/models/bluebird/byd-e6-prime.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    // Real length; width and height sit between the real e6 (1.81 × 1.67 m) and the chunkier scan.
    p: { L: 4.695, W: 1.86, H: 1.75, wb: 2.68, fo: 0.92, wr: 0.36, hoodH: 0.95, noseX: 0.06, cowlX: 1.15, cowlH: 1.12, roofX0: 2.05, roofX1: 4.15, drop: 0.08, rearX: 4.5, rearH: 1.2, tailH: 1.15, tumble: 0.9, tail: "bar", gr: 0, hl: [0.07, 0.42] } },
  { id: "alphard", cls: "silverbird", maker: "Toyota", model: "Alphard", short: "Alphard", paint: "#0b0c10", plate: "yellow", sign: "silver",
    blurb: "The executive taxi, in black. Silverbird has run since 1993 and was the first executive taxi service in Indonesia.",
    body: "Luxury MPV", seats: "7", power: "Petrol", note: "Named in the 2025 fleet line-up",
    r: { cap: 6, comfort: 10, eco: 4, agile: 5 },
    glb: "/models/silverbird/toyota-alphard.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    p: { L: 5.01, W: 1.85, H: 1.95, wb: 3.0, fo: 0.93, wr: 0.36, gc: 0.19, hoodH: 1.12, cowlX: 0.92, cowlH: 1.2, roofX0: 1.62, roofX1: 4.78, drop: 0.04, rearX: 4.93, rearH: 1.22, tailH: 1.19, tumble: 0.95, gr: [0.5, 1.1], hl: [0.09, 0.4], hlDrop: 0.1 } },
  { id: "modelx", cls: "silverbird", maker: "Tesla", model: "Model X", short: "Model X", paint: "#0b0c10", plate: "yellow", sign: "silver",
    blurb: "Five Model X 75Ds opened the electric Silverbird service in 2019, launched on the same day as the BYD e6.",
    body: "Electric SUV", seats: "Up to 7", power: "Electric", note: "Launched 2019 with 5 cars",
    r: { cap: 6, comfort: 9, eco: 10, agile: 5 },
    glb: "/models/silverbird/tesla-model-x.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    // The scan has its falcon-wing doors open, so give the loader the roof and body under them.
    glbFit: { roof: 36.6, halfWidth: 20.7 },
    // Real length; width and height sit between the real car (2.0 × 1.68 m) and the chunkier scan.
    p: { L: 5.04, W: 2.04, H: 1.76, wb: 2.97, fo: 0.96, wr: 0.37, hoodH: 0.86, noseX: 0.1, noseR: 0.2, cowlX: 1.08, cowlH: 1.02, roofX0: 2.1, roofX1: 3.55, drop: 0.13, rearX: 4.82, rearH: 1.12, tailH: 1.06, tumble: 0.88, tail: "bar", gr: 0, hl: [0.07, 0.4], hlDrop: 0.12 } },
  { id: "d9", cls: "goldenbird", maker: "Denza", model: "D9", short: "Denza D9", paint: "#0d0e12", plate: "white",
    blurb: "BYD's premium electric MPV. Bluebird announced it in March 2025 as a new Goldenbird car.",
    body: "Electric luxury MPV", seats: "7", power: "Electric", note: "Announced March 2025",
    r: { cap: 6, comfort: 10, eco: 10, agile: 4 },
    glb: "/models/goldenbird/denza-d9.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    p: { L: 5.25, W: 1.96, H: 1.92, wb: 3.11, fo: 0.98, wr: 0.37, hoodH: 1.1, cowlX: 0.98, cowlH: 1.18, roofX0: 1.72, roofX1: 5.0, rearX: 5.17, rearH: 1.21, tailH: 1.18, tumble: 0.95, tail: "bar", gr: [0.42, 1.2], hl: [0.07, 0.44], hlDrop: 0.1 } },
  { id: "ioniq5", cls: "goldenbird", maker: "Hyundai", model: "Ioniq 5", short: "Ioniq 5", paint: "#9aa4ae", plate: "white",
    blurb: "Hyundai's electric crossover, offered through the Goldenbird rental service.",
    body: "Electric crossover", seats: "5", power: "Electric", note: "Reported in the fleet, 2023",
    r: { cap: 4, comfort: 8, eco: 10, agile: 7 },
    p: { L: 4.64, W: 1.89, H: 1.6, wb: 3.0, fo: 0.85, wr: 0.37, hoodH: 0.92, noseX: 0.05, cowlX: 1.08, cowlH: 1.0, roofX0: 1.92, roofX1: 3.9, drop: 0.09, rearX: 4.48, rearH: 1.08, tailH: 1.04, tail: "bar", gr: 0, hl: [0.07, 0.5], panes: 2 } },
  { id: "ix", cls: "goldenbird", maker: "BMW", model: "iX", short: "BMW iX", paint: "#3a3f47", plate: "white",
    blurb: "Joined the electric Goldenbird range in 2023 through a tie-up with BMW Indonesia.",
    body: "Electric SUV", seats: "5", power: "Electric", note: "Joined in 2023",
    r: { cap: 4, comfort: 9, eco: 10, agile: 5 },
    p: { L: 4.95, W: 1.97, H: 1.7, wb: 3.0, fo: 0.9, wr: 0.39, gc: 0.21, hoodH: 1.04, noseX: 0.05, cowlX: 1.16, cowlH: 1.12, roofX0: 2.02, roofX1: 4.15, drop: 0.1, rearX: 4.8, rearH: 1.16, tailH: 1.1, tail: "bar", gr: [0.36, 0.5], hl: [0.06, 0.4], hlDrop: 0.12, clad: 1 } },
  { id: "hiace", cls: "bigbird", maker: "Toyota", model: "Hiace Commuter", short: "Hiace Commuter", paint: "#e4e9ee", plate: "yellow",
    blurb: "The group's people-mover van, listed for both Goldenbird rental and Bigbird charter work.",
    body: "Passenger van", seats: "Up to 16", power: "Diesel", note: "Named in the 2025 fleet line-up",
    r: { cap: 8, comfort: 5, eco: 3, agile: 4 },
    glb: "/models/bigbird/toyota-hiace.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    // The scan is the cab-over H200 Commuter, and its proportions match the real van, so it takes the real size.
    p: { L: 5.38, W: 1.88, H: 2.28, wb: 3.11, fo: 0.98, wr: 0.34, hoodH: 1.02, cowlX: 0.34, cowlH: 1.14, roofX0: 1.05, roofX1: 5.24, drop: 0, rearX: 5.31, rearH: 1.2, tailH: 1.17, tumble: 0.97, panes: 4, gr: [0.14, 0.9], hl: [0.14, 0.36], hlDrop: 0.14 } },
  { id: "coach", cls: "bigbird", maker: "Bigbird", model: "Charter Coach", short: "Charter Coach", paint: "#3f97dd", plate: "yellow",
    blurb: "A full-size charter bus. Bigbird was set up in December 1978 and started running the following year.",
    body: "Coach bus", seats: "Varies by bus", power: "Diesel", note: "Bus arm since 1979",
    r: { cap: 10, comfort: 7, eco: 3, agile: 1 },
    p: { L: 12, W: 2.5, H: 3.5, wb: 6.0, fo: 2.65, wr: 0.5, gc: 0.34, tw: 0.3, hoodH: 1.7, noseR: 0.12, cowlX: 0.09, cowlH: 1.75, roofX0: 0.42, roofX1: 11.86, drop: 0, rearX: 11.9, rearH: 1.78, tailH: 1.74, tailR: 0.12, tumble: 0.985, panes: 7, winTop: 3.12, gr: 0, hl: [0.14, 0.5], hlDrop: 0.95, bus: 1 } },
  { id: "jetbus", cls: "cititrans", maker: "Hino RM280", model: "Jetbus 5", short: "Jetbus 5", paint: "#eef1f4", plate: "yellow",
    blurb: "The Cititrans Busline coach: a Hino RM280 chassis under Adiputro's Jetbus 5 body, in a 28-seat Super Executive layout.",
    body: "Executive coach", seats: "28", power: "Diesel", note: "Cititrans joined the group in 2019",
    r: { cap: 9, comfort: 9, eco: 3, agile: 1 },
    p: { L: 12, W: 2.5, H: 3.7, wb: 5.9, fo: 2.7, wr: 0.5, gc: 0.34, tw: 0.3, hoodH: 1.75, noseX: 0.05, noseR: 0.14, cowlX: 0.12, cowlH: 1.8, roofX0: 0.7, roofX1: 11.8, drop: 0, rearX: 11.9, rearH: 1.9, tailH: 1.85, tailR: 0.14, tumble: 0.985, panes: 6, winTop: 3.3, gr: 0, hl: [0.12, 0.55], hlDrop: 0.95, bus: 1 } },
  { id: "torana", cls: "heritage", maker: "Holden", model: "Torana", short: "Torana", paint: "#3b78c2", plate: "yellow", sign: "blue",
    blurb: "Where it began. 25 Toranas made up the first Blue Bird fleet in 1972, and one is kept on display at head office in Jakarta.",
    body: "Sedan", seats: "5", power: "Petrol", note: "First fleet, 1972",
    r: { cap: 4, comfort: 3, eco: 2, agile: 8 },
    p: { L: 4.39, W: 1.6, H: 1.34, wb: 2.54, fo: 0.76, wr: 0.3, gc: 0.17, hoodH: 0.8, noseR: 0.08, cowlX: 1.45, cowlH: 0.86, roofX0: 1.88, roofX1: 2.95, drop: 0.02, rearX: 3.45, rearH: 0.86, tailH: 0.82, tailR: 0.07, tumble: 0.86, panes: 2, tail: "h", gr: [0.13, 0.9], hl: "round", chrome: 1 } },
  { id: "limo", cls: "heritage", maker: "Toyota", model: "Limo", short: "Toyota Limo", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: "The Vios-based sedan that carried the old Blue Bird livery, before MPVs took over regular taxi work.",
    body: "Sedan", seats: "5", power: "Petrol", note: "Wore the pre-2018 livery",
    r: { cap: 4, comfort: 5, eco: 5, agile: 8 },
    p: { L: 4.41, W: 1.7, H: 1.47, wb: 2.55, fo: 0.9, wr: 0.31, hoodH: 0.84, noseX: 0.05, cowlX: 1.15, cowlH: 0.94, roofX0: 1.92, roofX1: 3.15, drop: 0.04, rearX: 3.85, rearH: 1.0, tailH: 0.97, tumble: 0.88, panes: 2, tail: "h", gr: [0.1, 0.8] } },
  { id: "bmw-2002", cls: "heritage", maker: "BMW", model: "2002", short: "BMW 2002", paint: "#3f7fcf", plate: "yellow", sign: "silver",
    blurb: "A blue BMW 2002 with a white roof, dressed as a classic taxi. It isn't part of Bluebird's recorded fleet; it's here as a showroom piece from the same era as the first Toranas.",
    body: "Sedan", seats: "5", power: "Petrol", note: "Showroom piece, 1970s classic",
    r: { cap: 4, comfort: 4, eco: 2, agile: 8 },
    glb: "/models/heritage/bmw-2002.glb",
    glbYaw: Math.PI / 2, // Tripo export: nose at +z
    // Real length; width and height sit between the real car (1.59 × 1.41 m) and the chunkier scan,
    // so the scan isn't squashed enough to turn its wheels oval.
    p: { L: 4.23, W: 1.7, H: 1.5, wb: 2.5, fo: 0.73, wr: 0.3, gc: 0.16, hoodH: 0.82, noseR: 0.06, cowlX: 1.3, cowlH: 0.9, roofX0: 1.75, roofX1: 2.85, drop: 0.02, rearX: 3.3, rearH: 0.88, tailH: 0.84, tailR: 0.06, tumble: 0.86, panes: 2, tail: "h", gr: [0.14, 0.5], hl: "round", chrome: 1 } },
];

/* ---------- geometry ---------- */

/** Replace each point that carries a radius with a quadratic-bezier fillet. */
function roundPts(pts: RPt[]): Pt[] {
  const out: Pt[] = [];
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
  const clean: Pt[] = [];
  out.forEach((q) => {
    const l = clean[clean.length - 1];
    if (!l || Math.hypot(l[0] - q[0], l[1] - q[1]) > 1e-4) clean.push(q);
  });
  const f = clean[0], l = clean[clean.length - 1];
  if (Math.hypot(l[0] - f[0], l[1] - f[1]) < 1e-4) clean.pop();
  return clean;
}

function insetConvex(poly: (Pt | RPt)[], m: number): Pt[] {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const s = area > 0 ? 1 : -1;
  const lines: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
    lines.push([a[0] - (ey / len) * s * m, a[1] + (ex / len) * s * m, ex, ey]);
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const A = lines[(i + n - 1) % n], B = lines[i], den = A[2] * B[3] - A[3] * B[2];
    const t = ((B[0] - A[0]) * B[3] - (B[1] - A[1]) * B[2]) / den;
    out.push([A[0] + A[2] * t, A[1] + A[3] * t]);
  }
  return out;
}

/** Keep the side of the line pts[ax]=c: min ? >=c : <=c. */
function cut(pts: Pt[], ax: 0 | 1, min: boolean, c: number): Pt[] {
  const o: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const ia = min ? a[ax] >= c : a[ax] <= c, ib = min ? b[ax] >= c : b[ax] <= c;
    if (ia) o.push(a);
    if (ia !== ib) { const t = (c - a[ax]) / (b[ax] - a[ax]); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return o;
}

function makeProfile(p: Params): Profile {
  const L = p.L, H = p.H, gc = p.gc, wr = p.wr, ra = wr + 0.055, dy = wr - gc, axF = p.fo, axR = p.fo + p.wb;
  const a0 = -Math.asin(dy / ra);
  const arch = (ax: number): RPt[] => {
    const o: RPt[] = [];
    for (let k = 0; k <= 14; k++) { const a = a0 + ((Math.PI - 2 * a0) * k) / 14; o.push([ax + ra * Math.cos(a), wr + ra * Math.sin(a), 0]); }
    return o;
  };
  const body: RPt[] = [
    [0.17, gc, 0.08], [0, gc + 0.25, 0.09], [p.noseX, p.hoodH, p.noseR], [p.cowlX, p.cowlH, 0.05],
    [p.rearX, p.rearH, 0.05], [L - 0.035, p.tailH, p.tailR], [L, gc + 0.27, 0.09], [L - 0.17, gc, 0.08],
    ...arch(axR), ...arch(axF),
  ];
  const greenRaw: RPt[] = [
    [p.cowlX - 0.06, p.cowlH - 0.05, 0], [p.roofX0, H, 0.14], [p.roofX1, H - p.drop, 0.14], [p.rearX + 0.04, p.rearH - 0.05, 0],
  ];
  let inner = insetConvex(greenRaw, 0.09);
  if (p.winTop) inner = cut(inner, 1, false, p.winTop);
  const xs = inner.map((q) => q[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const n = p.panes, gap = p.bus ? 0.05 : 0.06, panes: Pt[][] = [];
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n + (i ? gap / 2 : 0);
    const xb = x0 + ((x1 - x0) * (i + 1)) / n - (i < n - 1 ? gap / 2 : 0);
    const pl = cut(cut(inner, 0, true, xa), 0, false, xb);
    if (pl.length >= 3) panes.push(pl);
  }
  return { body: roundPts(body), green: roundPts(greenRaw), greenRaw, panes, axF, axR, ra };
}

export const CARS: Car[] = RAW.map((c) => {
  const p = { ...D, ...c.p } as Params;
  return { ...c, p, prof: makeProfile(p) };
});

/* ---------- 2D side view (roster thumbnails + no-WebGL fallback) ---------- */

function mix(hex: string, to: string, t: number) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const r = [16, 8, 0].map((sh) => { const x = (a >> sh) & 255, y = (b >> sh) & 255; return Math.round(x + (y - x) * t); });
  return `rgb(${r.join(",")})`;
}

export function drawSide(cv: HTMLCanvasElement, car: Car, w: number, h: number, pad: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const c = cv.getContext("2d");
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const p = car.p, pr = car.prof, top = p.H + (car.sign ? 0.17 : p.bus ? 0.2 : 0);
  const sc = Math.min((w - pad * 2) / p.L, (h - pad * 2) / top), ox = (w - p.L * sc) / 2, oy = h - pad - (h - pad * 2 - top * sc) / 2;
  const T = (q: number[]): Pt => [ox + (p.L - q[0]) * sc, oy - q[1] * sc];
  const path = (pts: number[][]) => {
    c.beginPath();
    pts.forEach((q, i) => { const t = T(q); if (i) c.lineTo(t[0], t[1]); else c.moveTo(t[0], t[1]); });
    c.closePath();
  };
  c.fillStyle = "rgba(0,0,0,.5)";
  c.beginPath(); c.ellipse(w / 2, oy + 1, p.L * sc * 0.53, Math.max(1.5, sc * 0.07), 0, 0, 7); c.fill();
  [pr.axF, pr.axR].forEach((ax) => { const t = T([ax, p.wr]); c.fillStyle = "#04060a"; c.beginPath(); c.arc(t[0], t[1], pr.ra * sc, 0, 7); c.fill(); });
  const g = c.createLinearGradient(0, oy - top * sc, 0, oy);
  g.addColorStop(0, mix(car.paint, "#ffffff", 0.3)); g.addColorStop(0.55, mix(car.paint, "#ffffff", 0.06)); g.addColorStop(1, mix(car.paint, "#000000", 0.35));
  c.fillStyle = g; c.strokeStyle = "rgba(255,255,255,.34)"; c.lineWidth = 1; c.lineJoin = "round";
  path(pr.green); c.fill(); c.stroke(); path(pr.body); c.fill(); c.stroke();
  c.fillStyle = "#0a1622"; pr.panes.forEach((pl) => { path(pl); c.fill(); });
  [pr.axF, pr.axR].forEach((ax) => {
    const t = T([ax, p.wr]);
    c.fillStyle = "#0d0e12"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc, 0, 7); c.fill();
    c.fillStyle = "#aab3be"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc * 0.58, 0, 7); c.fill();
    c.fillStyle = "#3a4048"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc * 0.18, 0, 7); c.fill();
  });
  const hd = T([0.02, p.hoodH - p.hlDrop]), tl = T([p.L - 0.03, p.tailH - 0.16]), u = Math.max(1.5, sc * 0.07);
  c.fillStyle = "#ffe9ae"; c.fillRect(hd[0] - u * 1.6, hd[1] - u * 0.7, u * 1.6, u * 1.4);
  c.fillStyle = "#ff3040"; c.fillRect(tl[0], tl[1] - u * 0.7, u * 1.4, u * (p.tail === "v" ? 3 : 1.4));
  if (car.sign) {
    const sx = p.roofX0 + (p.roofX1 - p.roofX0) * 0.22, s = T([sx - 0.1, p.H + 0.14]);
    c.fillStyle = car.sign === "silver" ? "#eef2f6" : "#a9dcff";
    c.fillRect(s[0] - 0.2 * sc, s[1], 0.2 * sc, 0.13 * sc);
  }
}
