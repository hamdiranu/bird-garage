import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { Car } from "@/types/fleet";
import { paintedLivery } from "./livery";
import type { BuiltCar } from "./types";

/* Cars from scanned GLB models. Each scan is turned to face +x and scaled to the car's real size. A textured
   scan is shown unlit, exactly as its texture; an untextured one gets the livery painted on in a shader
   (see livery.ts). */

/** Tripo exports put the nose at +z; a quarter turn points it down +x like the rest of the app. */
const DEFAULT_YAW = Math.PI / 2;

const loads = new Map<string, Promise<BuiltCar>>();

export function loadScannedCar(car: Car): Promise<BuiltCar> {
  const scan = car.scan;
  if (!scan) return Promise.reject(new Error(`${car.id} has no scan`));
  let load = loads.get(car.id);
  if (!load) {
    // Models are shrunk with glTF-Transform (Meshopt geometry, WebP textures), so the loader needs the decoder.
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    load = loader.loadAsync(scan.src).then((gltf) => build(car, gltf.scene));
    loads.set(car.id, load);
  }
  return load;
}

/** Unpack quantised attributes (e.g. 16-bit positions limited to -1…1) into plain floats, so the geometry
    can be moved and scaled to metres without clipping. */
function toFloat(geo: THREE.BufferGeometry) {
  for (const [name, a] of Object.entries(geo.attributes)) {
    if (a instanceof THREE.BufferAttribute && a.array instanceof Float32Array && !a.normalized) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
    geo.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
}

function build(car: Car, scene: THREE.Object3D): BuiltCar {
  const scan = car.scan!;
  scene.updateMatrixWorld(true);
  let src: THREE.Mesh | undefined;
  scene.traverse((n) => { if (!src && n instanceof THREE.Mesh) src = n; });
  if (!src) throw new Error(`${scan.src}: no mesh`);
  const srcMat = src.material as THREE.MeshStandardMaterial;
  const textured = !!srcMat.map;
  const geo = src.geometry.clone();
  toFloat(geo);
  geo.applyMatrix4(src.matrixWorld);
  // An unlit scan has no use for normals; an untextured one gets smooth normals below.
  geo.deleteAttribute("normal");
  geo.rotateY(scan.yaw ?? DEFAULT_YAW);

  // Measure: roof height away from the narrow roof sign, and body width from the rear half (mirrors are up front).
  geo.computeBoundingBox();
  const bb = geo.boundingBox!, pos = geo.attributes.position as THREE.BufferAttribute;
  const midX = (bb.min.x + bb.max.x) / 2, midZ = (bb.min.z + bb.max.z) / 2, halfZ = (bb.max.z - bb.min.z) / 2;
  let roof = -Infinity, bodyHalf = 0;
  if (scan.fit) {
    roof = bb.min.y + scan.fit.roof;
    bodyHalf = scan.fit.halfWidth;
  } else {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = Math.abs(pos.getZ(i) - midZ);
      if (z > halfZ * 0.4) roof = Math.max(roof, y);
      if (x < midX) bodyHalf = Math.max(bodyHalf, z);
    }
  }
  // Length and height share one scale (close to it) so the wheels stay round; width is set on its own.
  // (Read the scan's size now: computeBoundingBox below reuses this same Box3.)
  const { L, H, W } = car.profile;
  const scanLen = bb.max.x - bb.min.x;
  const sx = L / scanLen, sy = H / (roof - bb.min.y), sz = W / (2 * bodyHalf);
  geo.translate(-midX, -bb.min.y, -midZ);
  geo.scale(sx, sy, sz);
  if (!textured) geo.computeVertexNormals();
  geo.computeBoundingBox();

  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, textured ? unlit(srcMat) : paintedLivery(car, geo, scanLen, sy)));
  return { root: group, wheels: [], height: geo.boundingBox!.max.y };
}

/** The scan's own colours with no shading: the stage's lights, reflections and accent rim don't touch it, and
    tone mapping is off so the texture's colours reach the screen unchanged (the same in both themes). */
function unlit(src: THREE.MeshStandardMaterial) {
  return new THREE.MeshBasicMaterial({
    map: src.map,
    color: src.color,
    side: src.side,
    transparent: src.transparent,
    opacity: src.opacity,
    alphaTest: src.alphaTest,
    toneMapped: false,
  });
}
