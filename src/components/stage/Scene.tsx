"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { SERVICES } from "@/data/services";
import { BACKDROP, backdropAnchor } from "@/lib/backdrop";
import { provideRenderer } from "@/lib/models/gpu";
import { loadCar } from "@/lib/models/loadCar";
import { buildSketchedCar } from "@/lib/models/sketchedCar";
import { glowTexture } from "@/lib/models/textures";
import type { BuiltCar } from "@/lib/models/types";
import type { Car } from "@/types/fleet";
import { facing, hotspotNormal, hotspotPoint } from "./hotspots";
import { LOOK, THEME_SECONDS, tweenColor } from "./lighting";
import { withReflection, type DeckedCar } from "./reflection";
import type { HotspotDots, RigRef, StageProps } from "./types";

const YELLOW = new THREE.Color("#f5c518");
/** Room left between two cars' turning circles in compare mode, metres. */
const GAP = 0.5;

/** After any change, keep drawing this long (ms) so loads, uploads and layout settle on screen. */
const AWAKE_MS = 600;
/** Eased values closer than this to their targets count as settled. */
const SETTLED = 1e-3;

/** The footprint radius of a car while it spins. */
const reachOf = (car: Car) => 0.5 * Math.hypot(car.profile.L, car.profile.W);

type Role = "car" | "pinned";

/** Lights, the camera that frames the cars on the backdrop photo's platform, and one turntable per car: the
    current car, plus the pinned one to its left in compare mode. */
export function Scene({ car, pinned, accent, rollKey, rigRef, reduceMotion, frame, theme, zoom, backdropRef, hotspots, onReady }: StageProps) {
  const { camera, size, gl, invalidate } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const lit = useRef(false);
  const decked = useMemo(() => new Map<string, DeckedCar>(), []);
  // the scans' textures are transcoded for this renderer's GPU
  useEffect(() => provideRenderer(gl), [gl]);

  // Drawing on demand (the canvas has frameloop="demand"): wake() draws for a moment, and the loop below keeps
  // drawing while anything moves. Every render of the scene (a new car, zoom, theme, size…) wakes it too.
  const awakeUntil = useRef(0);
  useEffect(() => {
    const rig = rigRef.current;
    rig.wake = () => { awakeUntil.current = performance.now() + AWAKE_MS; invalidate(); };
    return () => { rig.wake = () => {}; };
  }, [rigRef, invalidate]);
  useEffect(() => rigRef.current.wake());

  // Two cars stand side by side with their turning circles GAP apart, the pair centred on the platform.
  const spots = useMemo(() => {
    if (!pinned) return [{ role: "car" as Role, car, x: 0 }];
    const rA = reachOf(pinned), rB = reachOf(car);
    return [
      { role: "pinned" as Role, car: pinned, x: -(rB + GAP / 2) },
      { role: "car" as Role, car, x: rA + GAP / 2 },
    ];
  }, [car, pinned]);
  const halfWidth = pinned ? reachOf(pinned) + reachOf(car) + GAP / 2 : reachOf(car);
  const depth = Math.max(...spots.map((s) => reachOf(s.car)));

  // What each turntable is showing, and how tall it really is (open doors, roof sign); until a car is shown, its
  // listed roof height stands in.
  const [shown, setShown] = useState<Partial<Record<Role, { id: string; height: number }>>>({});
  const onShown = useCallback((role: Role, id: string, height: number) => {
    setShown((s) => (s[role]?.id === id ? s : { ...s, [role]: { id, height } }));
  }, []);
  const top = Math.max(...spots.map((s) => (shown[s.role]?.id === s.car.id ? shown[s.role]!.height : s.car.profile.H)));
  const ready = spots.every((s) => shown[s.role]?.id === s.car.id);
  useEffect(() => { if (ready) onReady?.(); }, [ready, onReady]);

  // dist/ox/oy frame the cars at 100%; z is the eased zoom; px/py is the screen point zooming in centres on.
  // Each has a target (…T) the render loop eases toward.
  const view = useRef({ dist: 10, distT: 10, ox: 0, oxT: 0, oy: 0, oyT: 0, z: 1, px: 0, pxT: 0, py: 0, pyT: 0, first: true });
  const photoScale = useRef({ s: 1, x: 0, y: 0 }); // last zoom applied to the photo layer, and its origin

  useEffect(() => {
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

  // Stand the cars on the photo's platform: aim the projection centre at the platform and size them to the ring,
  // the gap between the side cards, and the room under the top overlay, whichever is tightest. A pair may use
  // more of the ring than one car.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width, H = size.height, a = backdropAnchor(W, H);
    const ppuRing = (a.r * (pinned ? 0.92 : 0.72)) / halfWidth;
    const ppuWide = Math.max(40, Math.min(a.x - frame.side, W - frame.side - a.x) - frame.gutter) / halfWidth;
    const ppuTall = Math.max(40, a.y - frame.top - 8) / (top + depth * Math.sin(BACKDROP.el));
    const ppu = Math.min(ppuRing, ppuWide, ppuTall);
    const half = Math.tan(((cam.fov / 2) * Math.PI) / 180);
    const v = view.current;
    v.distT = H / (2 * half * ppu);
    v.oxT = -(a.x - W / 2);
    v.oyT = -(a.y - H / 2);
    // Zoom in around the middle of the cars as they stand on screen, so they grow in place.
    v.pxT = a.x;
    v.pyT = a.y - top * ppu * 0.45;
    // The first framing jumps straight to its targets (zoom included) instead of easing in from nowhere.
    if (v.first) { v.dist = v.distT; v.ox = v.oxT; v.oy = v.oyT; v.px = v.pxT; v.py = v.pyT; v.z = zoom; v.first = false; }
  }, [pinned, halfWidth, depth, top, camera, size, frame, zoom]);

  // The camera moves first each frame (priority -1), so the turntables place their hotspot dots against it.
  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta), v = view.current;
    if (rigRef.current.spin && !rigRef.current.dragging && !rigRef.current.hold && performance.now() - rigRef.current.lastInput > 1600) rigRef.current.yaw += dt * 0.3;
    const k = Math.min(1, dt * 5);
    v.dist += (v.distT - v.dist) * k;
    v.ox += (v.oxT - v.ox) * k;
    v.oy += (v.oyT - v.oy) * k;
    v.z += (zoom - v.z) * k;
    v.px += (v.pxT - v.px) * k;
    v.py += (v.pyT - v.py) * k;
    // Zooming in magnifies the rendered image around (px, py): the camera renders a smaller window of its
    // view (setViewOffset) and the photo is scaled by the same amount around the same point, so car and
    // platform grow together. Zooming out instead backs the camera off; the cars stay on the platform's
    // centre and just get smaller, since the photo can't shrink without showing its edges.
    const W = state.size.width, H = state.size.height;
    const zin = Math.max(1, v.z), d = v.dist / Math.min(1, v.z);
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.set(0, Math.sin(BACKDROP.el) * d, Math.cos(BACKDROP.el) * d);
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(W, H, v.ox + v.px * (1 - 1 / zin), v.oy + v.py * (1 - 1 / zin), W / zin, H / zin);
    cam.updateMatrixWorld();

    const bd = backdropRef.current, last = photoScale.current;
    if (bd && (Math.abs(zin - last.s) > 1e-4 || (zin > 1.0001 && Math.hypot(v.px - last.x, v.py - last.y) > 0.25))) {
      bd.style.transformOrigin = `${v.px}px ${v.py}px`;
      bd.style.transform = zin > 1.0001 ? `scale(${zin})` : "";
      photoScale.current = { s: zin, x: v.px, y: v.py };
    }

    // Ask for the next frame while anything moves: auto-spin, the camera easing, any GSAP tween (roll-in, preset
    // turns, the pick flash, theme light fades) or the moment after a wake-up. Nothing at all while off screen.
    const easing = Math.abs(v.distT - v.dist) > SETTLED * v.dist || Math.abs(zoom - v.z) > SETTLED
      || Math.abs(v.oxT - v.ox) + Math.abs(v.oyT - v.oy) + Math.abs(v.pxT - v.px) + Math.abs(v.pyT - v.py) > 0.1;
    const busy = (rigRef.current.spin && !rigRef.current.hold) || rigRef.current.dragging || easing || gsap.globalTimeline.getChildren(false, true, false).length > 0
      || performance.now() < awakeUntil.current;
    if (busy && !rigRef.current.offscreen) state.invalidate();
  }, -1);

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

      {spots.map((s) => (
        <Turntable
          key={s.role}
          role={s.role}
          car={s.car}
          x={s.x}
          rollKey={s.role === "car" ? rollKey : 0}
          rigRef={rigRef}
          pulse={s.role === "car"}
          reduceMotion={reduceMotion}
          decked={decked}
          hotspots={s.role === "car" && !pinned ? hotspots : null}
          onShown={onShown}
        />
      ))}
    </>
  );
}

interface TurntableProps {
  role: Role;
  car: Car;
  /** Where the turntable's centre stands on the deck; it slides there when this changes. */
  x: number;
  /** Bumped when the car should roll in rather than appear in place. */
  rollKey: number;
  rigRef: RigRef;
  /** The floor glow flashes yellow with the rig's pick pulse. */
  pulse: boolean;
  reduceMotion: boolean;
  /** Cars already built with their reflections, shared by both turntables. */
  decked: Map<string, DeckedCar>;
  hotspots: HotspotDots | null;
  onShown: (role: Role, id: string, height: number) => void;
}

/** One car on a spinning turntable, with a pool of its service colour and a soft shadow under it. The car rolls
    on when it changes; a scan shows once it has loaded. */
function Turntable({ role, car, x, rollKey, rigRef, pulse, reduceMotion, decked, hotspots, onShown }: TurntableProps) {
  const table = useRef<THREE.Group>(null);
  const slot = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  /** The car standing on the table now (the previous one stays until the next has loaded). */
  const current = useRef<{ id: string; dc: DeckedCar; rolling: boolean } | null>(null);
  const accent = SERVICES[car.service].accent;
  const accentColor = useRef(new THREE.Color(accent));
  const textures = useMemo(() => ({
    shadow: glowTexture("rgba(0,0,0,.85)", "rgba(0,0,0,.5)"),
    glow: glowTexture("rgba(255,255,255,.55)", "rgba(255,255,255,.18)"),
  }), []);
  // scratch vectors for placing hotspot dots
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), n: new THREE.Vector3(), cam: new THREE.Vector3() }), []);
  const { size } = useThree();

  const p = car.profile;
  const reach = reachOf(car);

  useEffect(() => { tweenColor(accentColor.current, accent); }, [accent]);

  // Swap the car in, rolling it onto the turntable. Scanned models load first; sketched ones build at once.
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
      rigRef.current.wake();
      const now = { id: car.id, dc, rolling: false };
      current.current = now;
      onShown(role, car.id, dc.height);
      dc.group.position.x = 0;
      if (!rollKey || reduceMotion) return;
      const d = Math.max(2.2, p.L * 0.42);
      now.rolling = true;
      roll = gsap.fromTo(dc.group.position, { x: -d }, {
        x: 0, duration: 0.7, ease: "power3.out",
        onUpdate: () => {
          const ang = -dc.group.position.x / p.wr;
          dc.wheels.forEach((w) => { w.rotation.z = ang; });
        },
        onComplete: () => { now.rolling = false; },
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
      current.current = null;
      loadCar(car).then((built) => show(deck(built))).catch((e) => console.error(`Couldn't load ${car.scan?.src}`, e));
    }
    return () => { live = false; roll?.kill(); if (current.current) current.current.rolling = false; };
  }, [role, car, p, reach, rollKey, reduceMotion, decked, onShown, rigRef]);

  /** Keep each hotspot's button over its point on screen, faded by how squarely it faces the camera. Hidden while
      the car is still loading or rolling in. */
  function placeDots(camera: THREE.Camera, t: THREE.Group) {
    const els = hotspots!.els.current, now = current.current;
    const live = now?.id === car.id && !now.rolling;
    if (live) t.updateMatrixWorld();
    camera.getWorldPosition(tmp.cam);
    hotspots!.list.forEach((h, i) => {
      const el = els[i];
      if (!el) return;
      let face = 0;
      if (live) {
        hotspotPoint(car, h, tmp.p).applyMatrix4(t.matrixWorld);
        hotspotNormal(h, tmp.n).applyAxisAngle(THREE.Object3D.DEFAULT_UP, t.rotation.y);
        face = THREE.MathUtils.clamp((facing(tmp.n, tmp.p, tmp.cam) - 0.08) / 0.3, 0, 1);
        tmp.p.project(camera);
        el.style.transform = `translate3d(${((tmp.p.x + 1) / 2) * size.width}px, ${((1 - tmp.p.y) / 2) * size.height}px, 0)`;
      }
      el.style.setProperty("--facing", face.toFixed(3));
      el.dataset.hidden = String(face < 0.35);
    });
  }

  useFrame((state, delta) => {
    const t = table.current;
    if (!t) return;
    // slide to its spot (entering or leaving compare mode, or a new partner of another size)
    t.position.x += (x - t.position.x) * Math.min(1, Math.min(0.05, delta) * 6);
    if (Math.abs(x - t.position.x) > SETTLED && !rigRef.current.offscreen) state.invalidate();
    t.rotation.y = rigRef.current.yaw;
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial, pv = pulse ? rigRef.current.pulse : 0;
      m.color.copy(accentColor.current).lerp(YELLOW, pv);
      m.opacity = 0.45 + 0.4 * pv;
      glow.current.scale.setScalar((glow.current.userData.s ?? 1) * (1 + 0.08 * pv));
    }
    if (hotspots) placeDots(state.camera, t);
  });

  return (
    <group ref={table}>
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
  );
}
