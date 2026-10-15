import type * as THREE from "three";

/** A car's 3D model, ready to put on the stage. */
export interface BuiltCar {
  /** The whole car; slide this for the roll-in. Clone it to show the car in a second scene. */
  root: THREE.Group;
  /** Wheels to turn while it rolls in (a scan is one piece, so it has none). */
  wheels: THREE.Object3D[];
  /** Highest point above the ground in metres (roof sign, open doors and all), for camera framing. */
  height: number;
}
