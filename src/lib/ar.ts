import * as THREE from "three";
import type { Car } from "@/types/fleet";
import type { ARMode } from "./arSupport";
import { loadCar } from "./models/loadCar";
import type { BuiltCar } from "./models/types";

/* "View in your space": the car at its real size, standing on the visitor's floor. The model is the one already
   on stage (scaled to metres, shown as its texture), so AR shows exactly what the garage does. */

export interface ARText {
  /** Shown until the car is placed. */
  place: string;
  /** Shown once it's standing. */
  move: string;
  exit: string;
}

export async function startAR(car: Car, mode: ARMode, text: ARText) {
  const built = await loadCar(car);
  if (mode === "quicklook") await quickLook(car, built);
  else await webXR(built, text);
}

/** A copy of the car on its own, turned to a front three-quarter view. */
function standAlone(built: BuiltCar) {
  const model = built.root.clone(true);
  model.position.set(0, 0, 0);
  model.rotation.set(0, -Math.PI / 4, 0);
  return model;
}

/** iPhone and iPad: export the car as USDZ and hand it to AR Quick Look, which places it on a floor. */
async function quickLook(car: Car, built: BuiltCar) {
  const [{ USDZExporter }, textureUtils] = await Promise.all([
    import("three/examples/jsm/exporters/USDZExporter.js"),
    import("three/examples/jsm/utils/WebGLTextureUtils.js"),
  ]);
  const scene = new THREE.Scene();
  const model = standAlone(built);
  // Quick Look reads standard materials; a matte one with the scan's texture lets the room's light fall on it.
  model.traverse((n) => {
    if (!(n instanceof THREE.Mesh)) return;
    const src = n.material as THREE.MeshBasicMaterial;
    n.geometry = n.geometry.clone();
    if (!n.geometry.attributes.normal) n.geometry.computeVertexNormals();
    n.material = new THREE.MeshStandardMaterial({ map: src.map, color: src.color, roughness: 0.8, metalness: 0 });
  });
  scene.add(model);
  // the GPU-compressed (KTX2) texture is unpacked back to an image for the file
  const exporter = new USDZExporter();
  exporter.setTextureUtils(textureUtils);
  const data = await exporter.parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 2048 });
  const url = URL.createObjectURL(new Blob([data], { type: "model/vnd.usdz+zip" }));
  // Quick Look opens from a rel="ar" link that holds an image.
  const link = document.createElement("a");
  link.rel = "ar";
  link.href = url;
  link.download = `${car.id}.usdz`;
  link.append(document.createElement("img"));
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Android: an immersive WebXR session. A ring follows the floor where the phone points; a tap stands the car
    there, a three-quarter view toward the visitor, and another tap moves it. */
async function webXR(built: BuiltCar, text: ARText) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;pointer-events:none;font:600 15px/1.4 system-ui,sans-serif;color:#fff";
  const hint = document.createElement("p");
  hint.textContent = text.place;
  hint.style.cssText = "position:absolute;left:50%;bottom:96px;transform:translateX(-50%);margin:0;padding:8px 16px;border-radius:999px;background:rgba(5,12,29,.72);white-space:nowrap";
  const exit = document.createElement("button");
  exit.textContent = text.exit;
  exit.style.cssText = "position:absolute;right:16px;top:16px;pointer-events:auto;padding:10px 18px;border:0;border-radius:999px;background:rgba(5,12,29,.8);color:#fff;font:inherit";
  // taps on the button shouldn't also place the car
  exit.addEventListener("beforexrselect", (e) => e.preventDefault());
  overlay.append(hint, exit);
  document.body.append(overlay);

  let session: XRSession;
  try {
    session = await navigator.xr!.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlay },
    });
  } catch (err) {
    overlay.remove();
    throw err;
  }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const model = built.root.clone(true);
  model.visible = false;
  scene.add(model);
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.3, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x5db4ff, transparent: true, opacity: 0.9 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const viewer = await session.requestReferenceSpace("viewer");
  const hits = await session.requestHitTestSource?.({ space: viewer });
  const at = new THREE.Vector3(), eye = new THREE.Vector3();

  session.addEventListener("select", () => {
    if (!reticle.visible) return;
    at.setFromMatrixPosition(reticle.matrix);
    model.position.copy(at);
    // nose 45° off the line to the visitor, so they see the front and one side
    camera.getWorldPosition(eye);
    model.rotation.set(0, Math.atan2(eye.x - at.x, eye.z - at.z) + Math.PI / 4 - Math.PI / 2, 0);
    model.visible = true;
    hint.textContent = text.move;
  });
  exit.addEventListener("click", () => session.end());

  renderer.setAnimationLoop((_, frame) => {
    const space = renderer.xr.getReferenceSpace();
    const hit = frame && hits && space ? frame.getHitTestResults(hits)[0] : undefined;
    const pose = hit && space ? hit.getPose(space) : undefined;
    reticle.visible = !!pose;
    if (pose) reticle.matrix.fromArray(pose.transform.matrix);
    renderer.render(scene, camera);
  });

  session.addEventListener("end", () => {
    renderer.setAnimationLoop(null);
    hits?.cancel();
    reticle.geometry.dispose();
    (reticle.material as THREE.Material).dispose();
    renderer.dispose();
    overlay.remove();
  });
}
