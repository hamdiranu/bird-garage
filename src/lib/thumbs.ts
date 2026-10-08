/* Renders a front three-quarter picture of every car for the roster, then frees the GL context. */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Car } from "./fleet";
import { loadCar } from "./carModel";

export async function renderThumbs(cars: Car[], w = 260, h = 130): Promise<Record<string, string>> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
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
      obj = (await loadCar(car)).root.clone(true);
    } catch {
      continue; // the roster falls back to the 2D profile for this car
    }
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.traverse((n) => { if (n instanceof THREE.Sprite) n.visible = false; });
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
    out[car.id] = renderer.domElement.toDataURL("image/png");
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
