import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Car } from "@/types/fleet";
import { provideRenderer } from "./gpu";
import { loadCar } from "./loadCar";

/* Renders a front three-quarter picture of each car with one off-screen renderer, then frees the GL context.
   The capture page (app/capture/thumbs) uses it to make the pre-rendered thumbnails in public/thumbs. */

export interface ThumbnailOptions {
  /** Called with each picture as soon as it's rendered. */
  onEach?: (id: string, url: string) => void;
  width?: number;
  height?: number;
  /** Image type for the data URLs, e.g. "image/webp", and its quality (0–1). */
  type?: string;
  quality?: number;
}

/** Data URLs keyed by car id, on a transparent background. A car whose model fails to load is left out. */
export async function renderThumbnails(cars: Car[], { onEach, width: w = 260, height: h = 130, type = "image/png", quality }: ThumbnailOptions = {}): Promise<Record<string, string>> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  // The stage compiles the same car materials with shader checks on, so this renderer skips them. That saves a
  // few blocking GL queries per shader and quiets the rounding notes Windows' Direct3D compiler leaves on three's
  // environment-map shaders (logged as "Program Info Log" warnings, though the shaders link and run fine).
  renderer.debug.checkShaderErrors = false;
  provideRenderer(renderer);
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x0a1430, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(4, 8, 6);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(24, w / h, 0.1, 200);
  const out: Record<string, string> = {};
  const box = new THREE.Box3(), sphere = new THREE.Sphere();

  for (const car of cars) {
    let obj: THREE.Object3D;
    try {
      // shared with the stage's cache, so this also fetches the models ahead of the visitor
      obj = (await loadCar(car)).root.clone(true);
    } catch {
      continue;
    }
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    scene.add(obj);
    box.setFromObject(obj).getBoundingSphere(sphere);
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(
      i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    // Front faces +x; look from front-left-above so the nose points right, as in a showroom card.
    const a = THREE.MathUtils.degToRad(40);
    const place = (d: number) => {
      camera.position.set(Math.sin(a) * d, sphere.center.y + d * 0.26, Math.cos(a) * d);
      camera.lookAt(sphere.center);
      camera.updateMatrixWorld();
    };
    // Dolly until the projected box fills the frame with a small margin.
    let dist = sphere.radius * 4;
    for (let i = 0; i < 4; i++) {
      place(dist);
      let mx = 0, my = 0;
      for (const c of corners) {
        const p = c.clone().project(camera);
        mx = Math.max(mx, Math.abs(p.x));
        my = Math.max(my, Math.abs(p.y));
      }
      dist *= Math.max(mx / 0.92, my / 0.86);
    }
    place(dist);
    renderer.render(scene, camera);
    out[car.id] = renderer.domElement.toDataURL(type, quality);
    onEach?.(car.id, out[car.id]);
    scene.remove(obj);
    // Let the page breathe between cars.
    await new Promise((r) => setTimeout(r, 0));
  }

  env.dispose();
  pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
