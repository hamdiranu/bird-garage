import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CARS } from "@/lib/fleet";
import type { BuiltCar } from "@/lib/models/types";
import { withReflection } from "../reflection";

function built(): BuiltCar {
  const paint = new THREE.MeshBasicMaterial({ color: "#2a86d6" });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 1.7), paint);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2), paint);
  wheel.name = "wheel";
  root.add(body, wheel);
  return { root, wheels: [wheel], height: 1.5 };
}

describe("withReflection", () => {
  it("adds an upside-down copy of the car under it", () => {
    const b = built();
    const dc = withReflection(CARS[0], b);
    expect(dc.group.children).toHaveLength(2);
    expect(dc.group.children[0]).toBe(b.root);
    expect(dc.group.children[1].scale.y).toBe(-1);
    expect(dc.height).toBe(1.5);
  });

  it("makes the copy see-through with its own materials, one per original", () => {
    const b = built();
    const dc = withReflection(CARS[0], b);
    const mirrored = new Set<THREE.Material>();
    dc.group.children[1].traverse((n) => { if (n instanceof THREE.Mesh) mirrored.add(n.material as THREE.Material); });
    expect(mirrored.size).toBe(1);
    const ghost = [...mirrored][0];
    expect(ghost).not.toBe((b.root.children[0] as THREE.Mesh).material);
    expect(ghost.transparent).toBe(true);
    expect(ghost.opacity).toBeCloseTo(0.24);
    expect(ghost.customProgramCacheKey()).toContain("deck-fade");
  });

  it("turns the wheels of both the car and its reflection", () => {
    const dc = withReflection(CARS[0], built());
    expect(dc.wheels).toHaveLength(2);
  });

  it("fades the copy with depth in its shader", () => {
    const dc = withReflection(CARS[0], built());
    let ghost: THREE.Material | undefined;
    dc.group.children[1].traverse((n) => { if (n instanceof THREE.Mesh) ghost = n.material as THREE.Material; });
    const shader = { vertexShader: "#include <common>\n#include <project_vertex>", fragmentShader: "#include <common>\n#include <dithering_fragment>", uniforms: {} };
    ghost!.onBeforeCompile(shader as never, {} as THREE.WebGLRenderer);
    expect(shader.vertexShader).toContain("vDeckY");
    expect(shader.fragmentShader).toContain("smoothstep");
  });
});
