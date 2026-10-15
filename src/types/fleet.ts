/* Shared types for the fleet: services, cars, ratings and the side profile each car is drawn from. */

/** A Bluebird Group service, e.g. the regular Bluebird taxis or the Goldenbird rental cars. */
export type ServiceKey = "bluebird" | "silverbird" | "goldenbird" | "bigbird" | "cititrans" | "heritage";
/** The header filter: one service, or all of them. */
export type FilterKey = "all" | ServiceKey;

export interface Service {
  name: string;
  /** What the service does, shown beside its name. */
  role: string;
  /** Accent colour for the car on stage, the rating bars and the pill. */
  accent: string;
  /** Square badge in public/icons. */
  badge: string;
}

/** This site's 0–10 ratings, shown as bars on the ratings card. */
export type RatingKey = "capacity" | "comfort" | "eco" | "agility";

/** Side-profile measurements in metres, x from the front bumper. They shape the sketched 3D model and the 2D
    drawing; a scanned car uses only the size (L, W, H) to scale its scan. */
export interface ProfileParams {
  /** Length, width and roof height. */
  L: number; W: number; H: number;
  /** Wheelbase, front overhang, wheel radius, ground clearance and tyre width. */
  wb: number; fo: number; wr: number; gc: number; tw: number;
  /** Outline points: bonnet height, base of the windscreen, start and end of the roof (which falls by `drop`
      toward the back), base of the rear window, top of the tail. */
  hoodH: number; cowlX: number; cowlH: number; roofX0: number; roofX1: number; drop: number;
  rearX: number; rearH: number; tailH: number;
  /** Glasshouse width as a share of the body's, and how many side windows it has. */
  tumble: number; panes: number;
  /** Nose and tail shape: how far the nose leans back, and the corner radii. */
  noseX: number; noseR: number; tailR: number;
  /** Lamps and grille: tail-lamp style, headlamp size (or round), headlamp drop below the bonnet, grille size. */
  tail: "v" | "bar" | "h"; hl: [number, number] | "round"; hlDrop: number; gr: [number, number] | 0;
  /** Top of the side windows (buses), and extras switched on with 1. */
  winTop?: number; bus?: 1; rails?: 1; clad?: 1; chrome?: 1;
}

type Point = [number, number];
/** A point with a corner radius. */
export type RoundedPoint = [number, number, number];

/** Polygons built from the profile, in metres. */
export interface Outline {
  body: Point[];
  /** The glasshouse, rounded and as raw points (the sketched model glazes its front and rear edges). */
  green: Point[];
  greenRaw: RoundedPoint[];
  panes: Point[][];
  /** Front and rear axle positions, and the wheel-arch radius. */
  axF: number; axR: number; ra: number;
}

/** A scanned 3D model in public/models, used instead of the sketch. */
export interface Scan {
  src: string;
  /** Turn (radians, about the vertical) that points the scan's nose to +x. Defaults to π/2, for Tripo exports,
      which put the nose at +z; Meshy exports put it at -x and need π. */
  yaw?: number;
  /** Roof height and half body width in the scan's own units, for scans the loader can't measure itself
      (e.g. doors modelled open, or a roof sign wide enough to pass for roof). */
  fit?: { roof: number; halfWidth: number };
}

/** A car as written in data/cars.ts: the profile lists only what differs from the defaults. */
export interface CarEntry {
  /** Unique; used in `/#id` links and saved state. */
  id: string;
  service: ServiceKey;
  maker: string;
  model: string;
  /** Name on the roster card. */
  short: string;
  /** Body colour of the sketch and 2D drawing. */
  paint: string;
  plate: "yellow" | "white";
  /** Optional taxi roof sign. */
  sign?: "blue" | "silver";
  blurb: string;
  body: string;
  seats: string;
  power: string;
  /** The car's place in the fleet, shown under the maker's emblem. */
  note: string;
  ratings: Record<RatingKey, number>;
  scan?: Scan;
  profile: Partial<ProfileParams>;
}

/** A car ready to show: its full profile and the outline built from it. */
export interface Car extends Omit<CarEntry, "profile"> {
  profile: ProfileParams;
  outline: Outline;
}

/** A maker's emblem, plus a version for the dark theme where the colour one would vanish on the dark card. */
export interface MakerLogo {
  src: string;
  dark?: string;
}
