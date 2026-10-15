"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Scene } from "./Scene";
import type { StageProps } from "./types";
import { useTurntableInput } from "./useTurntableInput";

/** The 3D view: a transparent canvas over the backdrop photo, turned by drag and zoomed by wheel or pinch.
    Import it with next/dynamic and ssr: false, so three.js stays out of the page's first bundle. */
export default function Stage(props: StageProps) {
  const { ref, handlers } = useTurntableInput(props.rig, props.onZoom);
  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-grab touch-pan-y data-[drag=true]:cursor-grabbing"
      role="img"
      aria-label={props.label}
      {...handlers}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 30, near: 0.1, far: 700, position: [0, 3, 10] }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
