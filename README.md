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

- **3D showroom.** Each vehicle stands on the glowing platform of a showroom photo, with a soft floor reflection and lighting matched to the photo. Drag to spin it, use the Front, Side and Rear camera presets, or zoom in from 75% to 250% (wheel, pinch, buttons or keys).
- **17 vehicles in 6 services:** Bluebird, Silverbird, Goldenbird, Bigbird, Cititrans and Heritage. Each service has its own badge and accent colour.
- **Scanned model support.** The Bluebird BYD e6 (in its real Prime livery), the Silverbird Toyota Alphard and Tesla Model X (falcon-wing doors open), the Goldenbird Denza D9, the Bigbird Toyota Hiace Commuter, and a vintage BMW 2002 taxi are textured 3D scans, compressed for the web (1.2–1.4 MB each). Untextured scans can be used too; they get the livery painted on by a shader.
- **Light and dark mode.** A daytime and a night-time showroom. The whole interface, the photo and the car's lighting cross-fade together in 0.7 s.
- **Focus view.** The side cards slide away, the car fills the stage, and its title moves to the top.
- **Info cards.** On the left: the service, maker and model, a description, a spec grid (body, seats, power, length) and the service badge with the car's fleet note. On the right: ratings out of 10 with an animated overall score and star row.
- **Roster strip.** 3D-rendered thumbnails of every vehicle, filtered by service.
- **Remembers your choices.** Your picked car, last-viewed car, spin and theme are saved. `/#<car-id>` links straight to a car.
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
| Zoom | Mouse wheel or pinch on the stage, or − / + in the toolbar; click the percentage to fit again. Changing car resets it |
| Auto-spin | Spin in the toolbar, or the ☰ menu |
| Pick a car | **Select this car** (press again to unpick, or use **Clear pick**) |
| Focus view | ⤢ button at the top right of the stage (desktop) |
| Light / dark mode | ☀/☾ button in the header (screens 640 px and wider), or ☰ menu → Light mode |

### Keyboard

| Key | Action |
|---|---|
| ← / → | Previous / next car (within the current filter) |
| Enter | Pick or unpick the current car |
| F | Toggle focus view (desktop widths) |
| + / − | Zoom in / out |
| 0 | Fit the car (100%) |
| Esc | Close the menu and leave focus view |

### What's saved

Saved in the browser's `localStorage`:

| Key | Contents |
|---|---|
| `bluebird-fleet-select` | `{ pick, last, spin }`: your picked car, the last car viewed and auto-spin |
| `bluebird-theme` | `"light"` or `"dark"`. If it's missing, the system setting is used |

A URL hash such as `/#e6-prime` opens that car and overrides the last-viewed one.

---

## Project structure

```text
public/
  showroom.jpg            night showroom (dark theme backdrop)
  showroom-day.jpg        day showroom (light theme backdrop), framed identically
  icons/*.png             service badges, trimmed to 128×128
  models/<service>/*.glb  textured scans, one folder per service (Meshopt + WebP, see "Add a scanned car"):
    bluebird/             BYD e6 Prime
    silverbird/           Toyota Alphard, Tesla Model X
    goldenbird/           Denza D9
    bigbird/              Toyota Hiace
    cititrans/            (empty for now)
    heritage/             BMW 2002
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
    fleet.ts              services, cars, ratings, side-profile geometry, 2D drawing
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
- **Sizing.** The car is scaled to whichever is tightest: the ring, the gap between the cards (plus room for the ‹ › buttons), or the space under the top overlay. Height is the model's real highest point, so a roof sign or the Model X's open doors stay in frame. Distance and offsets are eased every frame, so changing car, opening focus view or resizing all glide.
- **Zoom.** The photo can't change perspective, so zoom has to keep the car and the photo in step:
  - **Zooming in** magnifies the image around the middle of the car. The camera renders a smaller window of its view (`setViewOffset`), and the photo layer is CSS-scaled by the same factor around the same point, so car and platform grow together.
  - **Zooming out** below 100% backs the camera off instead. The car shrinks on the platform's centre, because shrinking the photo would expose its edges.
  - **Wheel and pinch.** The wheel uses a non-passive listener so it doesn't scroll the page; pinch tracks two pointers.
- **Reflection.** An upside-down copy of the car is rendered with see-through copies of its materials. A shader hook (`fadeBelowDeck`) fades it with depth, like polished stone.
- **Lighting.** Hemisphere, key, fill and rim lights, plus a Drei `<Environment>` built from `<Lightformer>`s for reflections. The rim light takes the service's accent colour. `LOOK` holds a night set and a day set, and GSAP tweens between them when the theme changes.
- **Animation.** Cars roll in from the left with spinning wheels (GSAP). Picking a car flashes the glow under it yellow. Camera presets tween the turntable angle the short way round.

### Sketched cars (`fleet.ts` → `carModel.ts`)

Each car's `p` parameters (length, height, wheelbase, overhangs, hood/cowl/roof/tail points, lamp sizes and so on) describe a **side profile**. `makeProfile()` turns them into rounded outlines: the body, the glasshouse and the window panes. `buildCar()` extrudes those into a bevelled 3D body. It then adds wheels, lamps, grille, plates, mirrors, roof sign, rails, cladding or chrome, and coach details for buses. The same profile draws the 2D thumbnails and the no-WebGL fallback.

### Scanned cars (`glbCar.ts`)

Every scan, textured or not, goes through the same steps when it loads:

1. **Decode.** The file is decoded with three's Meshopt decoder. Quantised attributes (16-bit positions, 8-bit normals) are unpacked to plain floats, so the next steps can't clip them.
2. **Orient.** It is turned to face +x like the other cars.
3. **Scale.** It is scaled to the car's `p.L` (length), `p.H` (roof height, measured away from the roof sign) and `p.W` (body width, measured in the rear half to skip the mirrors).

What happens next depends on the scan:

- **Textured scan** (all the current scans). It keeps its own PBR material and normals: colour, normal map, metalness and roughness from the file.
- **Untextured scan** (no UVs, no materials). It gets smooth normals and the Bluebird Prime livery painted in a fragment shader, by **position on the body**:
  - `u` runs from the front bumper (0) to the rear (1), `v` from the ground (0) to the roof (1), and `az` from the centre line (0) to the side (1).
  - Rules pick out the glass, lamps, plates, wheels (found from where the tyres touch the ground) and roof sign.
  - The "Bluebird PRIME" lettering and swoosh are drawn on a canvas and projected onto each side.
  - Floor-reflection copies re-apply this shader, which `material.clone()` would otherwise drop.

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
- **Size:** `L`, `W`, `H` (length, width, height). `L` is also shown on the info card as the car's length, so use the real figure.
- **Wheels:** `wb` (wheelbase), `fo` (front overhang), `wr` (wheel radius), `gc` (ground clearance).
- **Outline points:** `hoodH`, `cowlX/cowlH`, `roofX0/roofX1`, `rearX/rearH`, `tailH`.
- **Glasshouse:** `panes` (side windows), `tumble` (how much the glasshouse narrows).
- **Lamps and grille:** `tail` (`"v"`, `"bar"` or `"h"`), `hl` (headlamp size, or `"round"`), `gr` (grille size, or `0` for none).
- **Extras (set to `1`):** `rails`, `clad`, `chrome`, `bus`.

The easiest start is to copy a similar car and adjust. The roster, filters, counter and thumbnails pick it up automatically.

### Add a scanned (GLB) car

1. **Shrink it for the web.** Generated scans are large: the Tripo exports here are 17–27 MB, mostly 4K textures (one is a 10–19 MB PNG). [glTF-Transform](https://gltf-transform.dev/) compresses geometry with Meshopt and converts textures to 2048px WebP:

   ```bash
   npx @gltf-transform/cli optimize input.glb public/models/<service>/your-car.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false
   ```

   Tripo exports have about 100k triangles, so they don't need simplifying; each came out at 1.2–1.4 MB. For a much denser mesh (Meshy exports reached 0.7–1.8 million triangles), replace `--simplify false` with `--simplify-ratio 0.1 --simplify-error 0.001` to keep about a tenth of the vertices. Keep your original; the optimised copy is lossy.
2. **Check the orientation.** The loader uses the first mesh it finds and expects **y up**. Set `glbYaw` on the car to the turn that points its nose to +x:
   - Meshy exports put the nose at −x. That's the default (`Math.PI`), so leave `glbYaw` out.
   - Tripo exports put it at +z. Use `glbYaw: Math.PI / 2`, as on the Alphard.
   - If the model shows up backwards, add `Math.PI`.

   Units don't matter (Tripo's are centimetres); the model is scaled to `p` anyway.

   The loader measures the scan's roof height and body width to scale it. If parts stick out where the body should be (for example the Model X's open falcon-wing doors), pass the measurements in the scan's own units with `glbFit: { roof, halfWidth }`.
3. **Add the car** to `fleet.ts` as above, plus `glb: "/models/<service>/your-car.glb"`, where `<service>` is the car's `cls` (keep the file in that folder; if the car changes service, move it too). Set `p.L`, `p.H` (roof height, without any roof sign) and `p.W` (body width, without mirrors) to the real vehicle's size. If they're close to the scan's own proportions, scaling stays nearly uniform and textures don't stretch. The other `p` values are only used for the 2D fallback.
4. **Untextured scans only:** the painted livery is the Bluebird Prime design, laid out in `u`/`v`/`az` proportions. Another car usually needs its region numbers adjusted (belt line, A-pillar line, lamp and plate heights, `WHEEL_R`, decal band `D0/D1/E0/E1`). View it from the Front, Side and Rear presets while you tune.

### Add a service

1. Add a key to `ClassKey`, an entry in `CLASSES` (with `name`, `role` and `accent`), and the key to `ORDER` (all in `fleet.ts`).
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
- **Approximate painted livery.** Only affects untextured scans: the shader places it by body proportions, so it's close but not exact.
- **Locked camera tilt.** You can't tilt the camera up or down, so the car stays aligned with the showroom photo.
- **Hidden tabs pause animation.** Browsers pause rendering in hidden tabs, so camera easing, GSAP tweens and theme fades catch up when the tab is shown again.

---

## Credits

- Fleet facts (models, launch dates, service history) are from public Bluebird Group announcements and press coverage.
- The showroom photos, service badges and Bluebird icon were supplied for this project. The textured models (BYD e6, Alphard, Model X, Denza D9, Hiace and BMW 2002) were generated with Tripo. The BMW 2002 is a showroom piece, not part of Bluebird's recorded fleet.
- Bluebird, Silverbird, Goldenbird, Bigbird, Cititrans and related marks belong to PT Blue Bird Tbk. This is an unofficial fan project.
