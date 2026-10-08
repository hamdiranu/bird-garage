# Bird Garage

A 3D "car select" screen for the Bluebird Group fleet, styled like a game garage. Pick a service, spin each vehicle on a showroom turntable, compare ratings, and choose a favourite.

> Unofficial fan project, not affiliated with PT Blue Bird Tbk. Most 3D models are simplified sketches built from code, not manufacturer artwork. Ratings are made up for fun.

Built with **Next.js 16**, **React 19**, **React Three Fiber**, **Drei**, **Three.js**, **GSAP** and **Tailwind CSS 4**.

---

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Using the app](#using-the-app)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Adding and changing content](#adding-and-changing-content)
- [Browser support](#browser-support)
- [Known limitations](#known-limitations)
- [Credits](#credits)

---

## Features

- **3D showroom.** Each vehicle stands on the glowing platform of a showroom photo, with a soft floor reflection and lighting matched to the photo. Drag to spin it, or use the Front, Side and Rear camera presets.
- **16 vehicles in 7 services:** Bluebird, Bluebird Prime, Silverbird, Goldenbird, Bigbird, Cititrans and Heritage. Each service has its own badge and accent colour.
- **Scanned model support.** The Bluebird Prime BYD e6 uses a scanned 3D mesh. Its livery (paint, glass, lamps, plates, door lettering and swoosh) is painted on by a shader.
- **Light and dark mode.** A daytime and a night-time showroom. The whole interface, the photo and the car's lighting cross-fade together in 0.7 s.
- **Focus view.** The side cards slide away, the car fills the stage, and its title moves to the top.
- **Info cards.** Specs, three highlight traits, ratings out of 10 with an animated overall score, and a "best for" line per service.
- **Roster strip.** 3D-rendered thumbnails of every vehicle, filtered by service.
- **Remembers your choices.** Your picked car, last-viewed car, spin, lights and theme are saved. `/#<car-id>` links straight to a car.
- **Responsive.** Three columns on desktop. On tablets and phones the description stays beside the car and the ratings move below.
- **Accessible motion.** Respects `prefers-reduced-motion`. Without WebGL it falls back to a 2D side profile.

---

## Getting started

Requires **Node.js 20.9 or newer** (developed on Node 24).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check with no output |

The page is prerendered as static HTML. Images go through `next/image`, so host it on something that runs Next.js (for example `next start` or Vercel).

> `AGENTS.md` is written by `next dev` itself (Next 16 adds it for coding agents). It's safe to commit.

---

## Using the app

### Mouse and touch

| Action | How |
|---|---|
| Rotate the car | Drag on the stage (left and right only; the camera height matches the photo) |
| Change car | ‹ › buttons beside the car, or a card in the roster |
| Filter by service | Pills in the header |
| Camera presets | Front, Side, Rear in the toolbar under the car |
| Auto-spin, headlights | Spin and Lights in the toolbar, or the ☰ menu |
| Pick a car | **Select this car** (press again to unpick, or use **Clear pick**) |
| Focus view | ⤢ button at the top right of the stage (desktop) |
| Light / dark mode | ☀/☾ button in the header (screens 640 px and wider), or ☰ menu → Light mode |

### Keyboard

| Key | Action |
|---|---|
| ← / → | Previous / next car (within the current filter) |
| Enter | Pick or unpick the current car |
| F | Toggle focus view (desktop widths) |
| Esc | Close the menu and leave focus view |

### What's saved

Saved in the browser's `localStorage`:

| Key | Contents |
|---|---|
| `bluebird-fleet-select` | `{ pick, last, lamps, spin }`: your picked car, the last car viewed, lights and auto-spin |
| `bluebird-theme` | `"light"` or `"dark"`. If it's missing, the system setting is used |

A URL hash such as `/#e6-prime` opens that car and overrides the last-viewed one.

---

## Project structure

```text
public/
  showroom.jpg            night showroom (dark theme backdrop)
  showroom-day.jpg        day showroom (light theme backdrop), framed identically
  icons/*.png             service badges, trimmed to 128×128
  models/byd-e6-prime.glb scanned BYD e6 (untextured mesh)
src/
  app/
    layout.tsx            fonts, metadata, pre-paint theme script
    page.tsx              renders <Garage />
    globals.css           Tailwind setup, theme tokens, glass/brand utilities
    icon.png              favicon
  components/
    Garage.tsx            the whole HUD: header, cards, stage overlays, toolbar, roster, menu, focus view
    Stage.tsx             React Three Fiber scene: camera framing, lights, car, reflection, roll-in
    SideView.tsx          2D side profile on a <canvas> (WebGL fallback)
    Icon.tsx              inline line icons
    InlineScript.tsx      <script> that runs before hydration without React warnings
  lib/
    fleet.ts              services, cars, ratings, traits, side-profile geometry, 2D drawing
    carModel.ts           builds the sketched 3D cars; shared materials; loadCar()
    glbCar.ts             loads scanned cars and paints their livery in a shader
    thumbs.ts             renders the roster thumbnails offscreen
    backdrop.ts           backdrop photos and where their platform sits
    theme.ts              light/dark resolution and persistence
```

---

## How it works

### Page layout

`Garage.tsx` is a single client component.

- **Desktop (≥ 1024 px).** The 3D stage is full-bleed behind everything, and two frosted cards float over its left and right edges. The code measures how much of the stage the cards cover, along with the top hint/title and the bottom toolbar, and passes that to the 3D scene as a `Frame`. The car is then framed in the clear area between them.
- **Tablet and phone.** The stage becomes a grid cell beside the description card. The ratings card moves below, and on phones the toolbar gets its own row.
- **Header.** One row from 768 px up. The filter pills compact themselves below 1536 px. If they still don't fit, they scroll sideways, with faded edges only where pills are hidden.

### The 3D stage (`Stage.tsx`)

- **Transparent canvas over a photo.** The canvas has no background; the showroom photo is a CSS background behind it. `backdrop.ts` records where the photo's platform ring is: centre `(994, 785)` and radius `592`, in the photo's 2000×1116 pixels. `backdropAnchor()` converts that to screen coordinates for whatever size the stage is.
- **Standing on the platform.** The camera always looks at the car's ground point. `camera.setViewOffset` shifts the projection so that point lands on the ring's centre. The camera is tilted 8.7° (`el = asin(90 / 592)`, from the ring's height-to-width ratio), so the car's perspective matches the photo's. Vertical drag-tilt is locked for that reason.
- **Sizing.** The car is scaled to whichever is tightest: the ring, the gap between the cards (plus room for the ‹ › buttons), or the space under the top overlay. Distance and offsets are eased every frame, so changing car, opening focus view or resizing all glide.
- **Reflection.** An upside-down copy of the car is rendered with see-through copies of its materials. A shader hook (`fadeBelowDeck`) fades it with depth, like polished stone.
- **Lighting.** Hemisphere, key, fill and rim lights, plus a Drei `<Environment>` built from `<Lightformer>`s for reflections. The rim light takes the service's accent colour. `LOOK` holds a night set and a day set, and GSAP tweens between them when the theme changes.
- **Animation.** Cars roll in from the left with spinning wheels (GSAP). Picking a car flashes the glow under it yellow. Camera presets tween the turntable angle the short way round.

### Sketched cars (`fleet.ts` → `carModel.ts`)

Each car's `p` parameters (length, height, wheelbase, overhangs, hood/cowl/roof/tail points, lamp sizes and so on) describe a **side profile**. `makeProfile()` turns them into rounded outlines: the body, the glasshouse and the window panes. `buildCar()` extrudes those into a bevelled 3D body. It then adds wheels, lamps, grille, plates, mirrors, roof sign, rails, cladding or chrome, and coach details for buses. The same profile draws the 2D thumbnails and the no-WebGL fallback.

### Scanned cars (`glbCar.ts`)

The Bluebird Prime e6 is an untextured mesh (no UVs, no materials). When it loads:

1. It is turned to face +x like the other cars, and scaled to the car's `p.L / p.H / p.W`. Length and height share nearly the same scale, so the wheels stay round.
2. The wheel centres are found from where the tyres touch the ground. The rim face is the outermost point inside each wheel circle.
3. The livery is painted in a fragment shader by **position on the body**: `u` runs from the front bumper (0) to the rear (1), `v` from the ground (0) to the roof (1), and `az` from the centre line (0) to the side (1). Rules pick out the glass band, windscreen, A-pillars, headlamps, chrome bar, dotted panel, plates, tail lamps, wheels (tyre, rim, spoke gaps), roof sign and underside.
4. The "Bluebird PRIME" lettering and the rear-door swoosh are drawn on a canvas and projected flat onto each side, mirrored so the text reads correctly on both.
5. Lamps light from the same switch as the sketched cars (`lampUniform`). Floor-reflection copies re-apply the livery shader, which `material.clone()` would otherwise drop.

### Roster thumbnails (`thumbs.ts`)

About 0.7 s after load, a short-lived offscreen `WebGLRenderer` (with three's `RoomEnvironment`) renders every car at a front three-quarter angle. It dollies the camera until the projected bounding box fills the frame, saves each image as a PNG data URL, then disposes the renderer and frees its GL context.

### Light and dark theme (`globals.css`, `theme.ts`)

- **Colour tokens.** Every interface colour is a CSS custom property **registered with `@property`** (for example `--card-a`, `--ink`, `--edge`). Because the browser knows they're colours, one `transition` on `:root` animates them all when `<html data-theme>` changes. Every card, pill and border eases together, with no per-component transitions.
- **Backdrop.** Two photo layers cross-fade on the same 0.7 s curve, using a `light:` Tailwind variant.
- **Accent colours.** Pale service colours (Silverbird, Heritage) are pulled toward navy in light mode with `color-mix()`, driven by a registered `--accent-darken` percentage that also transitions.
- **No flash on load.** An inline `<head>` script picks the theme (saved choice, else the system setting) before the first paint. `Garage` re-applies it in a layout effect, because React's development remount clears attributes on `<html>`.
- **Reduced motion.** With `prefers-reduced-motion`, all transitions are switched off.

---

## Adding and changing content

### Add a sketched car

Add an entry to `RAW` in `src/lib/fleet.ts`:

```ts
{ id: "avanza", cls: "bluebird", maker: "Toyota", model: "Avanza", short: "Avanza",
  paint: "#2a86d6", plate: "yellow", sign: "blue",
  blurb: "One or two sentences about this car in the fleet.",
  body: "Compact MPV", seats: "7", power: "Petrol", note: "Short fleet note",
  r: { cap: 6, comfort: 5, eco: 5, agile: 8 },            // ratings, 0–10
  p: { L: 4.4, W: 1.73, H: 1.7, wb: 2.75, fo: 0.83, ... } }, // side profile, metres
```

| Field | Meaning |
|---|---|
| `id` | Unique; used in `/#id` links and saved state |
| `cls` | Service key (see below) |
| `paint` | Body colour |
| `plate` | `"yellow"` (public transport) or `"white"` (private) |
| `sign` | Optional roof sign: `"blue"` or `"silver"` |
| `r` | Ratings out of 10: `cap` (seats), `comfort`, `eco`, `agile` (city agility) |
| `p` | Profile in metres, measured from the front bumper. Anything left out takes the defaults in `D` |

Main profile values:
- **Size:** `L`, `W`, `H` (length, width, height).
- **Wheels:** `wb` (wheelbase), `fo` (front overhang), `wr` (wheel radius), `gc` (ground clearance).
- **Outline points:** `hoodH`, `cowlX/cowlH`, `roofX0/roofX1`, `rearX/rearH`, `tailH`.
- **Glasshouse:** `panes` (side windows), `tumble` (how much the glasshouse narrows).
- **Lamps and grille:** `tail` (`"v"`, `"bar"` or `"h"`), `hl` (headlamp size, or `"round"`), `gr` (grille size, or `0` for none).
- **Extras (set to `1`):** `rails`, `clad`, `chrome`, `bus`.

The easiest start is to copy a similar car and adjust. The roster, filters, counter and thumbnails pick it up automatically.

### Add a scanned (GLB) car

1. Put the `.glb` in `public/models/`. The loader uses the first mesh it finds. The scan should have **y up and the nose at −x**; change `geo.rotateY(Math.PI)` in `glbCar.ts` if yours differs.
2. Add the car to `fleet.ts` as above, plus `glb: "/models/your-car.glb"`. Set `p.L`, `p.H` (roof height, without any roof sign) and `p.W` (body width, without mirrors) to the size the scan should have. Keep the other `p` values sensible; they're used for the 2D fallback.
3. The livery in `glbCar.ts` is the Bluebird Prime design, laid out in `u`/`v`/`az` proportions. A different car usually needs its region numbers adjusted (belt line, A-pillar line, lamp and plate heights, `WHEEL_R`, decal band `D0/D1/E0/E1`). View it from the Front, Side and Rear presets while you tune.

### Add a service

1. Add a key to `ClassKey`, an entry in `CLASSES` (with `name`, `role`, `accent`, `best`, and optionally a short `pill` label), and the key to `ORDER` (all in `fleet.ts`).
2. Add its badge to `public/icons/<name>.png` (transparent, roughly square) and map it in `CLASS_BADGE` in `Garage.tsx`.

### Change a service badge

Replace `public/icons/<name>.png`. Trim any transparent margin so the badges match in size; 128×128 works well.

### Change the showroom photos

Both photos must be **framed identically** (same platform position). If you swap them:

1. Find the platform's glowing ring in the photo: its left and right edges on the centre row, and its back and front edges on the centre column.
2. In `backdrop.ts`, set `cx`, `cy` (ring centre) and `r` (half the left-to-right width), plus `w` and `h` (photo size).
3. Set `el = asin(ring height / ring width)` (the ring's height-to-width ratio), so the car's perspective matches.
4. Use `posY` to choose how much of the top or bottom of the photo is cropped on wide screens.

### Change the theme colours

Edit the token values in `src/app/globals.css`: the dark set under `:root`, the light set under `:root[data-theme="light"]`. To add a token, also add an `@property` rule for it and list it in `transition-property`; otherwise it switches instantly instead of fading.

---

## Browser support

Recent Chrome, Edge, Safari and Firefox.

| Feature | Needed for | Without it |
|---|---|---|
| WebGL | 3D stage and thumbnails | 2D side-profile drawing of the car |
| `@property` (Chrome 85+, Safari 16.4+, Firefox 128+) | Smooth theme fade | Theme switches instantly |
| `color-mix()` (Chrome 111+, Safari 16.2+, Firefox 113+) | Accent colours, stage edge shading | Accent-coloured details and shading lose their colour |
| `backdrop-filter` | Frosted cards | Cards are see-through but not blurred |

---

## Known limitations

- **No wheel spin on the scanned car.** The scan is one piece, so its wheels don't turn when it rolls onto the platform.
- **Approximate scanned livery.** It's placed by body proportions and is close but not exact. The real door logo isn't drawn; only "Bluebird PRIME" is lettered.
- **Locked camera tilt.** You can't tilt the camera up or down, so the car stays aligned with the showroom photo.
- **Hidden tabs pause animation.** Browsers pause rendering in hidden tabs, so camera easing, GSAP tweens and theme fades catch up when the tab is shown again.

---

## Credits

- Fleet facts (models, launch dates, service history) are from public Bluebird Group announcements and press coverage.
- The showroom photos, service badges, Bluebird icon and BYD e6 scan were supplied for this project.
- Bluebird, Silverbird, Goldenbird, Bigbird, Cititrans and related marks belong to PT Blue Bird Tbk. This is an unofficial fan project.
