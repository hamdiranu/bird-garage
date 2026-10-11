"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import type { Car } from "@/lib/fleet";
import { buildCar, glowTex, loadCar, type BuiltCar } from "@/lib/carModel";
import { BACKDROP, backdropAnchor } from "@/lib/backdrop";

/** Mutable turntable state shared between the HUD and the render loop. */
export interface Rig {
  yaw: number;
  spin: boolean;
  dragging: boolean;
  lastInput: number;
  pulse: number;
}

export interface Frame {
  side: number;
  top: number;
  bottom: number;
  /** Extra room to leave beside the car, e.g. for prev/next buttons at mid-height. */
  gutter: number;
}

interface StageProps {
  car: Car;
  accent: string;
  /** Bumped when the car should roll in rather than appear in place. */
  rollKey: number;
  rig: Rig;
  reduceMotion: boolean;
  /** Pixels of the canvas covered by HUD on each edge; the car must stay clear of them. */
  frame: Frame;
  theme: "dark" | "light";
  /** Magnification over the fitted view (1 = fit). Below 1 only the car shrinks; the photo can't, or its edges would show. */
  zoom: number;
  /** Ask the HUD to multiply the zoom (wheel and pinch on the stage). */
  onZoom: (factor: number) => void;
  /** The backdrop photo's layer, scaled with the zoom so the car stays standing on its platform. */
  backdrop: RefObject<HTMLDivElement | null>;
}

const YELLOW = new THREE.Color("#f5c518");
const REFLECT = 0.24;

/** Tween a colour toward a hex value with GSAP. */
function tweenColor(target: THREE.Color, hex: string, scale = 1, lerpWhite = 0, duration = 0.6) {
  const to = new THREE.Color(hex).multiplyScalar(scale).lerp(new THREE.Color(1, 1, 1), lerpWhite);
  gsap.to(target, { r: to.r, g: to.g, b: to.b, duration, ease: "power2.inOut", overwrite: true });
}

/** Lighting to match each backdrop: warm downlights and neon fill at night, bright neutral daylight by day.
    Intensities are in units of π (three's physical light scale). */
const LOOK = {
  dark: { sky: "#8fb0ff", ground: "#070d1f", hemi: 0.4, key: 1.05, keyColor: "#ffe6c4", fill: 0.55, fillColor: "#5d9bff", rim: 1.1, exposure: 0.95 },
  light: { sky: "#eef4ff", ground: "#8a99b0", hemi: 0.95, key: 1.55, keyColor: "#ffffff", fill: 0.45, fillColor: "#d4e4ff", rim: 0.6, exposure: 1.05 },
} as const;
/** Matches the CSS theme transition, so the car relights while the page and photo change. */
const THEME_SECONDS = 0.7;

interface Holder {
  group: THREE.Group;
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

/** The car plus an upside-down, see-through copy that reads as its reflection in the polished deck. */
function makeHolder(car: Car, built: BuiltCar): Holder {
  const root = built.root;
  const fade = car.p.H * 0.6;
  const mirror = root.clone(true);
  mirror.scale.y = -1;
  const made = new Map<THREE.Material, THREE.Material>(); // one faded copy per source material
  mirror.traverse((n) => {
    if (n instanceof THREE.Mesh) {
      const src = n.material as THREE.Material;
      let ghost = made.get(src);
      if (!ghost) {
        ghost = src.clone();
        src.userData.reapply?.(ghost);
        ghost.transparent = true;
        ghost.opacity = REFLECT;
        fadeBelowDeck(ghost, fade);
        made.set(src, ghost);
      }
      n.material = ghost;
    }
  });
  const group = new THREE.Group();
  group.add(root, mirror);
  const wheels: THREE.Object3D[] = [];
  group.traverse((n) => { if (n.name === "wheel") wheels.push(n); });
  return { group, wheels, height: built.height };
}

function Scene({ car, accent, rollKey, rig, reduceMotion, frame, theme, zoom, backdrop }: StageProps) {
  const { camera, size, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const lit = useRef(false);
  const spinG = useRef<THREE.Group>(null);
  const slot = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const accentC = useRef(new THREE.Color(accent));
  const holders = useMemo(() => new Map<string, Holder>(), []);
  const tex = useMemo(() => ({
    shadow: glowTex("rgba(0,0,0,.85)", "rgba(0,0,0,.5)"),
    glow: glowTex("rgba(255,255,255,.55)", "rgba(255,255,255,.18)"),
  }), []);

  const p = car.p;
  const reach = 0.5 * Math.hypot(p.L, p.W); // footprint radius while spinning
  // How tall the car on the platform really is (open doors, roof sign); the listed roof height until it's shown.
  const [shown, setShown] = useState<{ id: string; height: number } | null>(null);
  const top = shown?.id === car.id ? shown.height : p.H;
  // dist/ox/oy frame the car at 100%; z is the eased zoom; px/py is the screen point zooming in centres on.
  const view = useRef({ dist: 10, distT: 10, ox: 0, oxT: 0, oy: 0, oyT: 0, z: 1, px: 0, pxT: 0, py: 0, pyT: 0, first: true });
  const photoScale = useRef({ s: 1, x: 0, y: 0 }); // last zoom applied to the photo layer, and its origin

  useEffect(() => {
    tweenColor(accentC.current, accent);
    if (rim.current) tweenColor(rim.current.color, accent, 1, 0.35);
  }, [accent]);

  // Relight for the theme: at once on first mount, then eased alongside the page's own transition.
  useEffect(() => {
    const L = LOOK[theme], d = !lit.current || reduceMotion ? 0 : THEME_SECONDS, ease = "power2.inOut";
    lit.current = true;
    const to = (o: THREE.Light | null, intensity: number) => o && gsap.to(o, { intensity: intensity * Math.PI, duration: d, ease, overwrite: "auto" });
    to(hemi.current, L.hemi);
    to(key.current, L.key);
    to(fill.current, L.fill);
    to(rim.current, L.rim);
    if (hemi.current) {
      tweenColor(hemi.current.color, L.sky, 1, 0, d);
      tweenColor(hemi.current.groundColor, L.ground, 1, 0, d);
    }
    if (key.current) tweenColor(key.current.color, L.keyColor, 1, 0, d);
    if (fill.current) tweenColor(fill.current.color, L.fillColor, 1, 0, d);
    gsap.to(gl, { toneMappingExposure: L.exposure, duration: d, ease, overwrite: "auto" });
  }, [theme, gl, reduceMotion]);

  // Stand the car on the photo's platform: aim the projection centre at the platform and size the car
  // to the ring, the gap between the side cards, and the room under the top overlay, whichever is tightest.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width, H = size.height, a = backdropAnchor(W, H);
    const ppuRing = (a.r * 0.72) / reach;
    const ppuWide = Math.max(40, Math.min(a.x - frame.side, W - frame.side - a.x) - frame.gutter) / reach;
    const ppuTall = Math.max(40, a.y - frame.top - 8) / (top + reach * Math.sin(BACKDROP.el));
    const ppu = Math.min(ppuRing, ppuWide, ppuTall);
    const half = Math.tan(((cam.fov / 2) * Math.PI) / 180);
    const v = view.current;
    v.distT = H / (2 * half * ppu);
    v.oxT = -(a.x - W / 2);
    v.oyT = -(a.y - H / 2);
    // Zoom in around the middle of the car as it stands on screen, so it grows in place.
    v.pxT = a.x;
    v.pyT = a.y - top * ppu * 0.45;
    if (v.first) { v.dist = v.distT; v.ox = v.oxT; v.oy = v.oyT; v.px = v.pxT; v.py = v.pyT; v.z = zoom; v.first = false; }
  }, [p, reach, top, camera, size, frame]);

  // Swap the car in, rolling it onto the platform. Scanned models load first; sketched ones build at once.
  useEffect(() => {
    const s = slot.current;
    if (!s) return;
    shadow.current?.scale.set(p.L * 1.2, p.W * 1.8, 1);
    if (glow.current) {
      glow.current.userData.s = reach * 2.6;
      glow.current.scale.setScalar(reach * 2.6);
    }

    let live = true, tw: gsap.core.Tween | undefined;
    const show = (holder: Holder) => {
      if (!live) return;
      s.clear();
      s.add(holder.group);
      setShown({ id: car.id, height: holder.height });
      holder.group.position.x = 0;
      if (!rollKey || reduceMotion) return;
      const d = Math.max(2.2, p.L * 0.42);
      tw = gsap.fromTo(holder.group.position, { x: -d }, {
        x: 0, duration: 0.7, ease: "power3.out",
        onUpdate: () => {
          const ang = -holder.group.position.x / p.wr;
          holder.wheels.forEach((w) => { w.rotation.z = ang; });
        },
      });
    };
    const holderFor = (built: BuiltCar) => {
      let h = holders.get(car.id);
      if (!h) { h = makeHolder(car, built); holders.set(car.id, h); }
      return h;
    };

    const ready = holders.get(car.id);
    if (ready) show(ready);
    else if (!car.glb) show(holderFor(buildCar(car)));
    else {
      s.clear();
      loadCar(car).then((built) => show(holderFor(built))).catch((e) => console.error(`Couldn't load ${car.glb}`, e));
    }
    return () => { live = false; tw?.kill(); };
  }, [car, p, reach, rollKey, reduceMotion, holders]);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta), v = view.current;
    if (rig.spin && !rig.dragging && performance.now() - rig.lastInput > 1600) rig.yaw += dt * 0.3;
    const k = Math.min(1, dt * 5);
    v.dist += (v.distT - v.dist) * k;
    v.ox += (v.oxT - v.ox) * k;
    v.oy += (v.oyT - v.oy) * k;
    v.z += (zoom - v.z) * k;
    v.px += (v.pxT - v.px) * k;
    v.py += (v.pyT - v.py) * k;
    if (spinG.current) spinG.current.rotation.y = rig.yaw;
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.color.copy(accentC.current).lerp(YELLOW, rig.pulse);
      m.opacity = 0.45 + 0.4 * rig.pulse;
      glow.current.scale.setScalar((glow.current.userData.s ?? 1) * (1 + 0.08 * rig.pulse));
    }
    // Zooming in magnifies the rendered image around (px, py): the camera renders a smaller window of its
    // view (setViewOffset) and the photo is scaled by the same amount around the same point, so car and
    // platform grow together. Zooming out instead backs the camera off; the car stays on the platform's
    // centre and just gets smaller, since the photo can't shrink without showing its edges.
    const W = state.size.width, H = state.size.height;
    const zin = Math.max(1, v.z), d = v.dist / Math.min(1, v.z);
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.set(0, Math.sin(BACKDROP.el) * d, Math.cos(BACKDROP.el) * d);
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(W, H, v.ox + v.px * (1 - 1 / zin), v.oy + v.py * (1 - 1 / zin), W / zin, H / zin);

    const bd = backdrop.current, last = photoScale.current;
    if (bd && (Math.abs(zin - last.s) > 1e-4 || (zin > 1.0001 && Math.hypot(v.px - last.x, v.py - last.y) > 0.25))) {
      bd.style.transformOrigin = `${v.px}px ${v.py}px`;
      bd.style.transform = zin > 1.0001 ? `scale(${zin})` : "";
      photoScale.current = { s: zin, x: v.px, y: v.py };
    }
  });

  return (
    <>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#060c1c"]} />
        <Lightformer form="ring" intensity={2.2} color="#ffe2b0" scale={6} position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#9cc4ff" scale={[30, 6, 1]} position={[6, 4, -14]} />
        <Lightformer form="rect" intensity={2.4} color="#3d8bff" scale={[1, 10, 1]} position={[-9, 4, -6]} />
        <Lightformer form="rect" intensity={2.4} color="#3d8bff" scale={[1, 10, 1]} position={[9, 4, -6]} />
        <Lightformer form="rect" intensity={1.6} scale={[22, 1.2, 1]} position={[0, 2.2, 12]} rotation={[0, Math.PI, 0]} />
      </Environment>

      {/* key from the ceiling, fill from the side, rim in the service colour; colours and strengths come from LOOK */}
      <hemisphereLight ref={hemi} />
      <directionalLight ref={key} position={[3, 10, 5]} />
      <directionalLight ref={fill} position={[-7, 3, 4]} />
      <directionalLight ref={rim} position={[-2, 5, -9]} />

      <group ref={spinG}>
        {/* soft pool of the service colour on the deck; flares yellow on select */}
        <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.glow} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={shadow} rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.shadow} transparent depthWrite={false} />
        </mesh>
        <group ref={slot} />
      </group>
    </>
  );
}

export default function Stage(props: StageProps) {
  const { rig } = props;
  const drag = useRef({ x: 0 });
  const wrap = useRef<HTMLDivElement>(null);
  /** Fingers/pointers currently down on the stage, for pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const onZoom = useRef(props.onZoom);
  onZoom.current = props.onZoom;

  // Wheel zooms. React's wheel listener is passive (can't stop the page scrolling), so attach our own.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1); // lines/pages → pixels
      onZoom.current(Math.exp(-dy * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const release = (id: number) => {
    if (!pointers.current.delete(id)) return;
    if (pointers.current.size < 2) pinch.current = 0;
    const [rest] = [...pointers.current.values()];
    if (rest) { drag.current = { x: rest.x }; return; } // one finger left after a pinch: carry on turning
    rig.dragging = false;
    wrap.current?.removeAttribute("data-drag");
    rig.lastInput = performance.now();
  };

  return (
    <div
      ref={wrap}
      className="absolute inset-0 cursor-grab touch-pan-y data-[drag=true]:cursor-grabbing"
      role="img"
      aria-label={`3D model of the ${props.car.maker} ${props.car.model}. Drag to rotate, scroll or pinch to zoom.`}
      onPointerDown={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
        if (pointers.current.size === 2) { pinch.current = spread(); return; }
        rig.dragging = true;
        gsap.killTweensOf(rig, "yaw");
        wrap.current?.setAttribute("data-drag", "true");
        drag.current = { x: e.clientX };
      }}
      onPointerMove={(e) => {
        const pt = pointers.current.get(e.pointerId);
        if (!pt) return;
        pt.x = e.clientX;
        pt.y = e.clientY;
        if (pointers.current.size >= 2) {
          const d = spread();
          if (pinch.current > 0 && d > 0) onZoom.current(d / pinch.current);
          pinch.current = d;
          return;
        }
        if (!rig.dragging) return;
        // Turn only: the camera's height is fixed to match the photo behind.
        rig.yaw += (e.clientX - drag.current.x) * 0.009;
        drag.current = { x: e.clientX };
        rig.lastInput = performance.now();
      }}
      onPointerUp={(e) => release(e.pointerId)}
      onPointerCancel={(e) => release(e.pointerId)}
      onLostPointerCapture={(e) => release(e.pointerId)}
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
