import * as THREE from "three";

/* Materials shared by every sketched car, made once. Colours go through three's colour management, so hex
   values are sRGB as written. */

function makeMaterials() {
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  return {
    glass: std({ color: "#0a1018", metalness: 0.9, roughness: 0.08, side: THREE.DoubleSide }),
    dark: std({ color: "#0b0d11", metalness: 0.2, roughness: 0.7 }),
    grille: std({ color: "#14171c", metalness: 0.85, roughness: 0.32 }),
    rubber: std({ color: "#0a0a0c", metalness: 0, roughness: 0.9 }),
    rim: std({ color: "#b9c0c9", metalness: 0.9, roughness: 0.3 }),
    chrome: std({ color: "#e6eaef", metalness: 1, roughness: 0.12 }),
    pod: std({ color: "#c9d0d8", metalness: 0.2, roughness: 0.6 }),
    // lamps and roof signs are unlit, with just enough emission to read as lenses
    head: std({ color: "#dfe6ee", emissive: "#fff0cc", emissiveIntensity: 0.12, roughness: 0.3 }),
    tail: std({ color: "#3a0508", emissive: "#ff1a2c", emissiveIntensity: 0.25, roughness: 0.4 }),
    signB: std({ color: "#cfe8ff", emissive: "#8fd0ff", emissiveIntensity: 0.2, roughness: 0.5 }),
    signS: std({ color: "#f1f4f7", emissive: "#f1f4f7", emissiveIntensity: 0.15, roughness: 0.5 }),
    plateY: std({ color: "#f5c518", roughness: 0.6 }),
    plateW: std({ color: "#f2f3f5", roughness: 0.6 }),
  };
}

let materials: ReturnType<typeof makeMaterials> | null = null;
export function getMaterials() {
  return (materials ??= makeMaterials());
}

const paints: Record<string, THREE.MeshPhysicalMaterial> = {};
/** Glossy car paint, one material per colour. */
export function paintMaterial(hex: string) {
  return (paints[hex] ??= new THREE.MeshPhysicalMaterial({
    color: hex, metalness: 0.45, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.16,
  }));
}
