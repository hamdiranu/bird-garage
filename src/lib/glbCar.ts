/* Scanned cars from GLB files. A textured scan keeps its own material. An untextured mesh (no UVs, no
   materials) gets the livery painted on in a shader, with regions placed in the car's own proportions:
   u runs from the front bumper (0) to the rear (1), v from the ground (0) to the roof (1), and az from
   the centre line (0) to the body side (1). */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { Car } from "./fleet";
import type { BuiltCar } from "./carModel";

const loads = new Map<string, Promise<BuiltCar>>();

export function loadGlbCar(car: Car): Promise<BuiltCar> {
  let p = loads.get(car.id);
  if (!p) {
    // Models are shrunk with glTF-Transform (Meshopt geometry, WebP textures), so the loader needs the decoder.
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    p = loader.loadAsync(car.glb!).then((gltf) => build(car, gltf.scene));
    loads.set(car.id, p);
  }
  return p;
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

/* Side decal band, in u/v. */
const D0 = 0.33, D1 = 0.97, E0 = 0.17, E1 = 0.7;
/* Wheel radius as a share of the car's length, measured off the scan's side view. */
const WHEEL_R = 0.079;

function build(car: Car, scene: THREE.Object3D): BuiltCar {
  scene.updateMatrixWorld(true);
  let src: THREE.Mesh | undefined;
  scene.traverse((n) => { if (!src && n instanceof THREE.Mesh) src = n; });
  if (!src) throw new Error(`${car.glb}: no mesh`);
  const srcMat = src.material as THREE.MeshStandardMaterial;
  const textured = !!srcMat.map;
  const geo = src.geometry.clone();
  toFloat(geo);
  geo.applyMatrix4(src.matrixWorld);
  // A textured scan's normals match its normal map, so keep them; an untextured one gets smooth normals below.
  if (!textured) geo.deleteAttribute("normal");
  geo.rotateY(car.glbYaw ?? Math.PI); // the app's cars face +x

  // Measure: roof height away from the narrow roof sign, and body width from the rear half (mirrors are up front).
  geo.computeBoundingBox();
  const bb = geo.boundingBox!, pos = geo.attributes.position as THREE.BufferAttribute;
  const midX = (bb.min.x + bb.max.x) / 2, midZ = (bb.min.z + bb.max.z) / 2, halfZ = (bb.max.z - bb.min.z) / 2;
  let roof = -Infinity, bodyHalf = 0;
  if (car.glbFit) {
    roof = bb.min.y + car.glbFit.roof;
    bodyHalf = car.glbFit.halfWidth;
  } else {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = Math.abs(pos.getZ(i) - midZ);
      if (z > halfZ * 0.4) roof = Math.max(roof, y);
      if (x < midX) bodyHalf = Math.max(bodyHalf, z);
    }
  }
  // Length and height share one scale (close to it) so the wheels stay round; width is set on its own.
  // (Read the scan's size now: computeBoundingBox below reuses this same Box3.)
  const { L, H, W } = car.p;
  const scanLen = bb.max.x - bb.min.x;
  const sx = L / scanLen, sy = H / (roof - bb.min.y), sz = W / (2 * bodyHalf);
  geo.translate(-midX, -bb.min.y, -midZ);
  geo.scale(sx, sy, sz);
  if (!textured) geo.computeVertexNormals();
  geo.computeBoundingBox();

  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, textured ? srcMat : paintedMaterial(car, geo, scanLen, sy)));
  return { root: group, wheels: [], height: geo.boundingBox!.max.y };
}

/** The Bluebird Prime livery for an untextured scan, fitted to its wheels. */
function paintedMaterial(car: Car, geo: THREE.BufferGeometry, scanLen: number, sy: number) {
  const { L, H, W } = car.p, pos = geo.attributes.position as THREE.BufferAttribute;

  // Wheel centres: where the tyres touch the ground.
  const front: number[] = [], rear: number[] = [];
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0.03) (pos.getX(i) > 0 ? front : rear).push(pos.getX(i));
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
  const wf = mean(front), wr = mean(rear);
  const rx = WHEEL_R * L, ry = WHEEL_R * scanLen * sy; // the same scan radius under each axis' scale
  // Outer face of the rims: the furthest-out points inside the rim circle.
  let rimZ = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    for (const cx of [wf, wr]) if (Math.hypot((x - cx) / rx, (y - ry) / ry) < 0.6) rimZ = Math.max(rimZ, Math.abs(pos.getZ(i)));
  }

  return liveryMaterial({ front: L / 2, len: L, roof: H, halfW: W / 2, wf, wr, rx, ry, rimZ });
}

interface Dims { front: number; len: number; roof: number; halfW: number; wf: number; wr: number; rx: number; ry: number; rimZ: number }

/** Door lettering on the front door and the two-tone swoosh over the rear door, for one side.
    frontLeft: the car's nose is at the left edge of the band (as seen on the car's left side). */
function decal(frontLeft: boolean) {
  const W = 2048, H = 626, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const X = (s: number) => (frontLeft ? s : 1 - s) * W, Y = (t: number) => (1 - t) * H;

  // swoosh over the rear door: it rises from the sill mid-door to the base of the rear quarter window,
  // a cyan band leading a lighter one, with deep blue filling everything behind
  const sweep = (color: string, s0: number, s2: number) => {
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(X(s0), Y(0));
    x.bezierCurveTo(X(s0 + 0.14), Y(0.22), X(s2 - 0.1), Y(0.72), X(s2), Y(1));
    x.lineTo(X(1), Y(1));
    x.lineTo(X(1), Y(0));
    x.closePath();
    x.fill();
  };
  sweep("#29bfdb", 0.4, 0.78);
  sweep("#5fd3f1", 0.46, 0.85);
  sweep("#2268b4", 0.52, 0.93);

  // lettering on the front door
  x.fillStyle = "#ffffff";
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  const cx = X(0.17);
  x.font = '700 104px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  x.fillText("Bluebird", cx, Y(0.5));
  x.font = '700 64px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  if ("letterSpacing" in x) (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
  x.fillText("PRIME", cx, Y(0.33));

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const LIVERY_GLSL = /* glsl */ `
uniform vec3 uBody, uGlass, uTyre, uRim, uChrome, uPanel, uPlate, uSign;
uniform vec4 uDims;    // front x, length, roof height, half width
uniform vec4 uWheels;  // front centre x, rear centre x, radius along x, radius along y (= centre height)
uniform float uRimZ;
uniform sampler2D uDecalA, uDecalB;
varying vec3 vCarP;
varying vec3 vCarN;

void livery(out vec3 col, out float rough, out float metal, out float coat) {
  vec3 p = vCarP, n = normalize(vCarN);
  float u = (uDims.x - p.x) / uDims.y, v = p.y / uDims.z, az = abs(p.z) / uDims.w, side = abs(n.z);
  col = uBody; rough = 0.3; metal = 0.35; coat = 1.0;

  // underside
  if (n.y < -0.55 && v < 0.3) { col = uTyre; rough = 0.9; metal = 0.0; coat = 0.0; return; }

  // wheels: tyre ring, silver rim face, dark between the spokes (they sit deeper than the rim face)
  for (int i = 0; i < 2; i++) {
    float cx = i == 0 ? uWheels.x : uWheels.y;
    float d = length(vec2((p.x - cx) / uWheels.z, (p.y - uWheels.w) / uWheels.w));
    if (d < 1.0 && az > 0.6) {
      coat = 0.0;
      if (d > 0.66) { col = uTyre; rough = 0.85; metal = 0.0; }
      else if (d < 0.15 || abs(p.z) < uRimZ - 0.035) { col = uTyre * 1.3; rough = 0.55; metal = 0.3; }
      else { col = uRim; rough = 0.28; metal = 0.9; }
      return;
    }
    if (d < 1.22 && az < 0.9 && n.y < 0.2) { col = uTyre; rough = 0.9; metal = 0.0; coat = 0.0; return; }
  }

  // roof sign
  if (v > 1.015) { col = uSign; rough = 0.4; metal = 0.0; coat = 0.3; return; }

  // glass: side windows behind the A-pillar, the windscreen, the tailgate window
  float top = 0.955;
  float belt = mix(0.70, 0.745, clamp((u - 0.35) / 0.6, 0.0, 1.0));
  float aLine = mix(0.37, 0.53, clamp((v - belt) / (top - belt), 0.0, 1.0));
  // (starting a little ahead of the glass so the A-pillars come out black, as on the real car)
  bool glass = v > belt && v < top && u > aLine - 0.035 && u < 0.965 && side > 0.3;
  glass = glass || (n.x > 0.2 && u > 0.28 && u < 0.6 && v > 0.69 && v < top && az < 0.88);
  glass = glass || (n.x < -0.3 && u > 0.9 && v > 0.64 && v < 0.95 && az < 0.86);
  if (glass) { col = uGlass; rough = 0.05; metal = 0.6; return; }

  // nose: slim headlamps rising to the corners, chrome bar, plate, dotted panel, corner vents, lower intake
  if (u < 0.09 && n.x > 0.3) {
    float lampBase = 0.545 + 0.03 * smoothstep(0.5, 0.92, az);
    if (az > 0.5 && az < 0.93 && v > lampBase && v < lampBase + 0.045) { col = vec3(0.85); rough = 0.1; metal = 0.9; return; }
    if (v > 0.585 && v < 0.61 && az < 0.5) { col = uChrome; rough = 0.15; metal = 1.0; return; }
    if (v > 0.255 && v < 0.35 && az < 0.25) { col = uPlate; rough = 0.5; metal = 0.0; coat = 0.2; return; }
    if (v > 0.1 && v < 0.24) { col = uTyre; rough = 0.6; metal = 0.2; return; }
    if (v > 0.26 && v < 0.46 && az > 0.74 && v < 0.26 + (az - 0.74) * 1.4) { col = uTyre; rough = 0.6; metal = 0.2; return; }
    if (v > 0.24 && v < 0.53) {
      vec2 f = fract(vec2(p.z, p.y) * 34.0) - 0.5;
      col = mix(uPanel, uPanel * 0.55, step(length(f), 0.24));
      return;
    }
  }

  // tail: lamps, plate, lower bumper
  if (u > 0.93 && n.x < -0.3) {
    if (v > 0.56 && v < 0.66 && az > 0.45) { col = vec3(0.45, 0.02, 0.03); rough = 0.2; metal = 0.3; return; }
    if (v > 0.38 && v < 0.47 && az < 0.25) { col = uPlate; rough = 0.5; metal = 0.0; return; }
    if (v < 0.3) { col = uTyre; rough = 0.7; metal = 0.1; return; }
  }

  // door lettering and swoosh, projected flat onto each side
  if (side > 0.45 && u > ${D0} && u < ${D1} && v > ${E0} && v < ${E1}) {
    float s = (u - ${D0}) / ${(D1 - D0).toFixed(3)}, t = (v - ${E0}) / ${(E1 - E0).toFixed(3)};
    vec4 d = p.z < 0.0 ? texture2D(uDecalA, vec2(s, t)) : texture2D(uDecalB, vec2(1.0 - s, t));
    col = mix(col, d.rgb, d.a);
  }
}
`;

function liveryMaterial(d: Dims) {
  const uniforms = {
    uBody: { value: new THREE.Color("#1fa6dc") },
    uGlass: { value: new THREE.Color("#1b2229") },
    uTyre: { value: new THREE.Color("#141516") },
    uRim: { value: new THREE.Color("#b9bec4") },
    uChrome: { value: new THREE.Color("#e3e8ee") },
    uPanel: { value: new THREE.Color("#1f8cb7") },
    uPlate: { value: new THREE.Color("#f5c518") },
    uSign: { value: new THREE.Color("#eef6ff") },
    uDims: { value: new THREE.Vector4(d.front, d.len, d.roof, d.halfW) },
    uWheels: { value: new THREE.Vector4(d.wf, d.wr, d.rx, d.ry) },
    uRimZ: { value: d.rimZ },
    uDecalA: { value: decal(true) },
    uDecalB: { value: decal(false) },
  };
  const apply = (m: THREE.Material) => {
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vCarP;\nvarying vec3 vCarN;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCarP = transformed;\nvCarN = objectNormal;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${LIVERY_GLSL}`)
        .replace("#include <color_fragment>", "#include <color_fragment>\nvec3 carCol; float carRough, carMetal, carCoat;\nlivery(carCol, carRough, carMetal, carCoat);\ndiffuseColor.rgb = carCol;")
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = carRough;")
        .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = carMetal;")
        .replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= carCoat;\n#endif");
    };
    m.customProgramCacheKey = () => "livery-prime";
  };
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.35, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  apply(m);
  // material.clone() drops onBeforeCompile; copies (e.g. the floor reflection) re-apply the livery with this.
  m.userData.reapply = apply;
  return m;
}
