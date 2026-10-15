import * as THREE from "three";
import type { BuiltCar } from "@/lib/models/types";
import type { Car } from "@/types/fleet";

/* The car as it stands on the polished deck: the model plus an upside-down, see-through copy that reads as
   its reflection. */

/** How opaque the reflection is at the deck line. */
const REFLECT = 0.24;

export interface DeckedCar {
  group: THREE.Group;
  /** Wheels of the car and its reflection, turned together during the roll-in. */
  wheels: THREE.Object3D[];
  /** Top of the model above the ground, metres. */
  height: number;
}

/** Fade a material's alpha out with depth below the deck, like a reflection in polished stone.
    Chains onto any shader hook the material already has (e.g. a painted livery). */
function fadeBelowDeck(m: THREE.Material, depth: number) {
  const d = depth.toFixed(2);
  const prev = m.onBeforeCompile.bind(m), prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader, renderer) => {
    prev(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vDeckY;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvDeckY = (modelMatrix * vec4(transformed, 1.0)).y;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vDeckY;")
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(-${d}, 0.0, vDeckY);`);
  };
  m.customProgramCacheKey = () => `${prevKey()}|deck-fade-${d}`;
}

export function withReflection(car: Car, built: BuiltCar): DeckedCar {
  const root = built.root;
  const fade = car.profile.H * 0.6;
  const mirror = root.clone(true);
  mirror.scale.y = -1;
  const faded = new Map<THREE.Material, THREE.Material>(); // one faded copy per source material
  mirror.traverse((n) => {
    if (!(n instanceof THREE.Mesh)) return;
    const src = n.material as THREE.Material;
    let ghost = faded.get(src);
    if (!ghost) {
      ghost = src.clone();
      src.userData.reapply?.(ghost);
      ghost.transparent = true;
      ghost.opacity = REFLECT;
      fadeBelowDeck(ghost, fade);
      faded.set(src, ghost);
    }
    n.material = ghost;
  });
  const group = new THREE.Group();
  group.add(root, mirror);
  const wheels: THREE.Object3D[] = [];
  group.traverse((n) => { if (n.name === "wheel") wheels.push(n); });
  return { group, wheels, height: built.height };
}
