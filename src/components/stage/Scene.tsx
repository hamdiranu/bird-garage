"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { BACKDROP, backdropAnchor } from "@/lib/backdrop";
import { loadCar } from "@/lib/models/loadCar";
import { buildSketchedCar } from "@/lib/models/sketchedCar";
import { glowTexture } from "@/lib/models/textures";
import type { BuiltCar } from "@/lib/models/types";
import { LOOK, THEME_SECONDS, tweenColor } from "./lighting";
import { withReflection, type DeckedCar } from "./reflection";
import type { StageProps } from "./types";

const YELLOW = new THREE.Color("#f5c518");

/** Lights, the floor glow and shadow, the current car on its turntable, and the camera that frames it on the
    backdrop photo's platform. */
export function Scene({ car, accent, rollKey, rig, reduceMotion, frame, theme, zoom, backdrop }: StageProps) {
  const { camera, size, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const lit = useRef(false);
  const turntable = useRef<THREE.Group>(null);
  const slot = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const accentColor = useRef(new THREE.Color(accent));
  const decked = useMemo(() => new Map<string, DeckedCar>(), []);
  const textures = useMemo(() => ({
    shadow: glowTexture("rgba(0,0,0,.85)", "rgba(0,0,0,.5)"),
    glow: glowTexture("rgba(255,255,255,.55)", "rgba(255,255,255,.18)"),
  }), []);

  const p = car.profile;
  const reach = 0.5 * Math.hypot(p.L, p.W); // footprint radius while spinning
  // How tall the car on the platform really is (open doors, roof sign); the listed roof height until it's shown.
  const [shown, setShown] = useState<{ id: string; height: number } | null>(null);
  const top = shown?.id === car.id ? shown.height : p.H;
  // dist/ox/oy frame the car at 100%; z is the eased zoom; px/py is the screen point zooming in centres on.
  // Each has a target (…T) the render loop eases toward.
  const view = useRef({ dist: 10, distT: 10, ox: 0, oxT: 0, oy: 0, oyT: 0, z: 1, px: 0, pxT: 0, py: 0, pyT: 0, first: true });
  const photoScale = useRef({ s: 1, x: 0, y: 0 }); // last zoom applied to the photo layer, and its origin

  useEffect(() => {
    tweenColor(accentColor.current, accent);
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
    // The first framing jumps straight to its targets (zoom included) instead of easing in from nowhere.
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

    let live = true, roll: gsap.core.Tween | undefined;
    const show = (dc: DeckedCar) => {
      if (!live) return;
      s.clear();
      s.add(dc.group);
      setShown({ id: car.id, height: dc.height });
      dc.group.position.x = 0;
      if (!rollKey || reduceMotion) return;
      const d = Math.max(2.2, p.L * 0.42);
      roll = gsap.fromTo(dc.group.position, { x: -d }, {
        x: 0, duration: 0.7, ease: "power3.out",
        onUpdate: () => {
          const ang = -dc.group.position.x / p.wr;
          dc.wheels.forEach((w) => { w.rotation.z = ang; });
        },
      });
    };
    const deck = (built: BuiltCar) => {
      let dc = decked.get(car.id);
      if (!dc) { dc = withReflection(car, built); decked.set(car.id, dc); }
      return dc;
    };

    const ready = decked.get(car.id);
    if (ready) show(ready);
    else if (!car.scan) show(deck(buildSketchedCar(car)));
    else {
      s.clear();
      loadCar(car).then((built) => show(deck(built))).catch((e) => console.error(`Couldn't load ${car.scan?.src}`, e));
    }
    return () => { live = false; roll?.kill(); };
  }, [car, p, reach, rollKey, reduceMotion, decked]);

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
    if (turntable.current) turntable.current.rotation.y = rig.yaw;
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.color.copy(accentColor.current).lerp(YELLOW, rig.pulse);
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

      <group ref={turntable}>
        {/* soft pool of the service colour on the deck; flares yellow on select */}
        <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={textures.glow} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={shadow} rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={textures.shadow} transparent depthWrite={false} />
        </mesh>
        <group ref={slot} />
      </group>
    </>
  );
}
