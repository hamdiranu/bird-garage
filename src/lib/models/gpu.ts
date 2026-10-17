import type * as THREE from "three";

/* The scans' textures are KTX2 (Basis Universal), which is transcoded on load into whichever compressed format
   the GPU reads. Choosing that format takes a renderer, so the first renderer to start (the stage, or the
   thumbnail capture) hands itself over here, and model loads wait for it. Any renderer will do: they all run on the
   same GPU. */

let give: (renderer: THREE.WebGLRenderer) => void = () => {};
let given = false;

/** Resolves with the first renderer handed over. */
export const firstRenderer = new Promise<THREE.WebGLRenderer>((resolve) => { give = resolve; });

export function provideRenderer(renderer: THREE.WebGLRenderer) {
  if (given) return;
  given = true;
  give(renderer);
}
