import type { Car } from "@/types/fleet";

/* A car's side profile drawn flat on a canvas: the roster placeholder until the 3D thumbnails are ready, and the
   stage itself when the browser has no WebGL. */

type Point = [number, number];

/** Blend two #rrggbb colours: t = 0 gives `hex`, 1 gives `to`. */
function mix(hex: string, to: string, t: number) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const rgb = [16, 8, 0].map((sh) => { const x = (a >> sh) & 255, y = (b >> sh) & 255; return Math.round(x + (y - x) * t); });
  return `rgb(${rgb.join(",")})`;
}

/** Draw `car` facing right, centred in a w×h canvas (CSS pixels) with `pad` around it. */
export function drawSideView(cv: HTMLCanvasElement, car: Car, w: number, h: number, pad: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const c = cv.getContext("2d");
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const p = car.profile, ol = car.outline, top = p.H + (car.sign ? 0.17 : p.bus ? 0.2 : 0);
  const sc = Math.min((w - pad * 2) / p.L, (h - pad * 2) / top), ox = (w - p.L * sc) / 2, oy = h - pad - (h - pad * 2 - top * sc) / 2;
  const T = (q: number[]): Point => [ox + (p.L - q[0]) * sc, oy - q[1] * sc];
  const path = (pts: number[][]) => {
    c.beginPath();
    pts.forEach((q, i) => { const t = T(q); if (i) c.lineTo(t[0], t[1]); else c.moveTo(t[0], t[1]); });
    c.closePath();
  };

  // shadow and wheel arches
  c.fillStyle = "rgba(0,0,0,.5)";
  c.beginPath(); c.ellipse(w / 2, oy + 1, p.L * sc * 0.53, Math.max(1.5, sc * 0.07), 0, 0, 7); c.fill();
  [ol.axF, ol.axR].forEach((ax) => { const t = T([ax, p.wr]); c.fillStyle = "#04060a"; c.beginPath(); c.arc(t[0], t[1], ol.ra * sc, 0, 7); c.fill(); });

  // body and glasshouse in a lit paint gradient, then the windows
  const g = c.createLinearGradient(0, oy - top * sc, 0, oy);
  g.addColorStop(0, mix(car.paint, "#ffffff", 0.3)); g.addColorStop(0.55, mix(car.paint, "#ffffff", 0.06)); g.addColorStop(1, mix(car.paint, "#000000", 0.35));
  c.fillStyle = g; c.strokeStyle = "rgba(255,255,255,.34)"; c.lineWidth = 1; c.lineJoin = "round";
  path(ol.green); c.fill(); c.stroke(); path(ol.body); c.fill(); c.stroke();
  c.fillStyle = "#0a1622"; ol.panes.forEach((pl) => { path(pl); c.fill(); });

  // wheels: tyre, rim, hub
  [ol.axF, ol.axR].forEach((ax) => {
    const t = T([ax, p.wr]);
    c.fillStyle = "#0d0e12"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc, 0, 7); c.fill();
    c.fillStyle = "#aab3be"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc * 0.58, 0, 7); c.fill();
    c.fillStyle = "#3a4048"; c.beginPath(); c.arc(t[0], t[1], p.wr * sc * 0.18, 0, 7); c.fill();
  });

  // head and tail lamps, roof sign
  const hd = T([0.02, p.hoodH - p.hlDrop]), tl = T([p.L - 0.03, p.tailH - 0.16]), u = Math.max(1.5, sc * 0.07);
  c.fillStyle = "#ffe9ae"; c.fillRect(hd[0] - u * 1.6, hd[1] - u * 0.7, u * 1.6, u * 1.4);
  c.fillStyle = "#ff3040"; c.fillRect(tl[0], tl[1] - u * 0.7, u * 1.4, u * (p.tail === "v" ? 3 : 1.4));
  if (car.sign) {
    const sx = p.roofX0 + (p.roofX1 - p.roofX0) * 0.22, s = T([sx - 0.1, p.H + 0.14]);
    c.fillStyle = car.sign === "silver" ? "#eef2f6" : "#a9dcff";
    c.fillRect(s[0] - 0.2 * sc, s[1], 0.2 * sc, 0.13 * sc);
  }
}
