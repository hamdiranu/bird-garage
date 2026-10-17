import * as THREE from "three";
import type { Car, Hotspot } from "@/types/fleet";

/* Where a hotspot sits on the 3D car, and which way the body faces there, so its dot can hide while it's round
   the far side. Both are in the car's own frame: nose toward +x, centred on its turntable, metres. */

/** The hotspot's point on the car. Its right side (seen from the driver's seat) is -z. */
export function hotspotPoint(car: Car, h: Hotspot, out = new THREE.Vector3()) {
  const { L, H, W } = car.profile;
  const [along, up, across] = h.at;
  return out.set(L / 2 - along * L, up * H, (-across * W) / 2);
}

/** Roughly the body's outward direction at the hotspot: front, rear, side or up, blended near the corners. */
export function hotspotNormal(h: Hotspot, out = new THREE.Vector3()) {
  const [along, up, across] = h.at;
  const lean = (v: number) => Math.sign(v) * Math.abs(v) ** 4; // only the ends of each axis count
  return out.set(lean(1 - 2 * along), Math.max(0, (up - 0.6) / 0.4) ** 2, lean(-across)).normalize();
}

/** How squarely the hotspot faces the camera: 1 straight on, 0 or less side-on or behind. A point on top of
    the car counts as facing, since the camera always looks down on it a little. */
export function facing(normal: THREE.Vector3, point: THREE.Vector3, camera: THREE.Vector3) {
  const dx = camera.x - point.x, dz = camera.z - point.z, d = Math.hypot(dx, dz) || 1;
  return (normal.x * dx + normal.z * dz) / d + normal.y;
}
