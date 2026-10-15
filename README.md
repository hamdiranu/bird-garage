# Bird Garage

A 3D "car select" screen for the Bluebird Group fleet, styled like a game garage. Pick a service, spin each vehicle on a showroom turntable, compare ratings, and choose a favourite.

Created by **Hamdi Ranuharja**. © 2026 Hamdi Ranuharja.

> Unofficial fan project, not affiliated with PT Blue Bird Tbk. The 3D models are fan-made (generated scans), not manufacturer artwork. Ratings are made up for fun.

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

- **3D showroom.** Each vehicle stands on the glowing platform of a showroom photo, with a soft floor reflection. Scanned cars are shown unlit, exactly as their textures. Drag to spin it, use the Front, Side and Rear camera presets, or zoom in from 75% to 250% (wheel, pinch, buttons or keys).
- **16 vehicles in 6 services:** Bluebird, Silverbird, Goldenbird, Bigbird, Cititrans and Heritage. Each service has its own badge and accent colour.
- **Scanned model support.** All 16 are textured 3D scans in their real liveries, compressed for the web (1.1–1.4 MB each); the Model X has its falcon-wing doors open. A car without a scan is sketched in 3D from its side profile instead, and untextured scans get the livery painted on by a shader.
- **Light and dark mode.** A daytime and a night-time showroom. The whole interface and the photo cross-fade together in 0.7 s.
- **Focus view.** The side cards slide away, the car fills the stage, and its title moves to the top.
- **Info cards.** On the left: the service, maker and model, a description, a spec grid (body, seats, power, length) and the maker's emblem with the car's fleet note. On the right: ratings out of 10 with an animated overall score and star row.
- **Roster strip.** 3D-rendered thumbnails of every vehicle, filtered by service.
- **English and Bahasa Indonesia.** An EN | ID switch translates the whole interface and every car's description and specs, with numbers written the local way (4,39 m). A first visit follows the browser's language.
- **Showroom mode.** For a lobby or event screen: after a minute without input the garage tours the cars on its own, and any touch, key or mouse move hands control back. Switch it on in the ☰ menu, or open `/?showroom`.
- **Remembers your choices.** Your picked car, last-viewed car, spin, showroom mode, language and theme are saved. `/#<car-id>` links straight to a car.
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
| Language | EN \| ID switch in the header (screens 640 px and wider), or ☰ menu → Language |
| Showroom mode | ☰ menu → Showroom mode, or a `/?showroom` link (see below) |

### Showroom mode

Meant for a screen nobody is driving, such as a lobby display. Once it's on, a minute without input starts a tour: the garage moves to the next car in the current filter every 9 seconds, spinning each one (even with auto-spin off), with a "touch to explore" badge over the stage. Any touch, key, wheel or mouse move stops the tour straight away, and the next idle minute starts it again.

- The ☰ menu switch is remembered.
- A `/?showroom` link turns it on for that visit only, so a kiosk can be set up without changing saved settings. `/?showroom=20` starts the tour after 20 idle seconds instead of 60 (5–600).

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
| `bluebird-fleet-select` | `{ pick, last, spin, showroom }`: your picked car, the last car viewed, auto-spin and showroom mode |
| `bluebird-theme` | `"light"` or `"dark"`. If it's missing, the system setting is used |
| `bluebird-lang` | `"en"` or `"id"`. If it's missing, Indonesian browsers get Indonesian and everyone else English |

A URL hash such as `/#e6-prime` opens that car and overrides the last-viewed one.

---

## Project structure

```text
public/
  showroom.jpg            night showroom (dark theme backdrop)
  showroom-day.jpg        day showroom (light theme backdrop), framed identically
  icons/*.png             service badges, trimmed to 128×128
  logos/                  car maker emblems (SVG, or WebP for Hino), with dark-theme versions where needed and Cardog's MIT licence
  models/<service>/*.glb  textured scans, one folder per service (Meshopt + WebP, see "Add a scanned car"):
    bluebird/             Toyota Transmover, Honda Mobilio, Honda BR-V, BYD M6, BYD e6 Prime
    silverbird/           Toyota Alphard, Tesla Model X
    goldenbird/           Denza D9, BMW iX, Hyundai Ioniq 5
    bigbird/              Toyota Hiace, Charter Coach
    cititrans/            Hino RM280 Jetbus 5
    heritage/             Holden Torana, Toyota Limo, BMW 2002
src/
  app/                    routing only
    layout.tsx            fonts, metadata, pre-paint theme script
    page.tsx              renders <Garage /> inside the language provider
    globals.css           Tailwind setup, theme tokens, glass/brand utilities
    icon.png              favicon
  components/
    garage/               the car-select page, one file per part
      Garage.tsx          page shell: shared state, saved state, shortcuts, focus-view slide; lays out the parts
      Header.tsx          brand, counter, language and theme switches and menu, over the filter pills
      FilterPills.tsx     service filters (scroll fade, active pill kept in view)
      HeaderMenu.tsx      ☰ menu: language, display switches, showroom mode and shortcut list
      LanguageToggle.tsx  EN | ID switch
      ThemeToggle.tsx     sun/moon button
      Showroom.tsx        the stage cell: photo, 3D view or 2D fallback, overlay, buttons
      StageButtons.tsx    prev/next, focus toggle, edge tabs
      Toolbar.tsx         camera presets, spin, zoom
      InfoCard.tsx        left card: service, maker, model, blurb, specs, maker emblem
      RatingsCard.tsx     right card: overall score, rating bars, select button
      Roster.tsx          car strip along the bottom
      view.ts             camera presets and zoom limits
      use*.ts             page hooks: keyboard shortcuts, showroom tour, side-card inset, roster thumbnails
    stage/                the 3D view (client only, loaded with next/dynamic)
      Stage.tsx           <Canvas> and its pointer/wheel input
      Scene.tsx           lights, camera framing and zoom, car swapping and roll-in
      reflection.ts       the car's faded mirror image on the deck
      lighting.ts         night and day light sets
      useTurntableInput.ts  drag to turn, pinch and wheel to zoom
      types.ts            Rig, Frame and StageProps, shared with the page
    ui/                   generic pieces: Icon, SideView (2D canvas), InlineScript
  data/                   content, no logic
    cars.ts               the fleet in roster order, with the profile defaults
    services.ts           services (name, role, accent, badge) and the filter order
    makers.ts             maker emblems
  hooks/                  reusable hooks: useMediaQuery, useElementSize, useFitText
  i18n/                   translations
    messages.ts           every interface string, in English and Indonesian
    I18nProvider.tsx      current language, useI18n() for t (strings), text() (data text) and number()
  lib/                    logic, no React
    fleet.ts              CARS (entries + defaults + outline), RATING_KEYS and lookups
    outline.ts            side profile → body, glasshouse and window polygons
    sideView.ts           draws the 2D side view on a canvas
    models/               3D models
      loadCar.ts          scan or sketch for a car
      sketchedCar.ts      extrudes the outline into a 3D car
      scannedCar.ts       loads, turns and scales a GLB scan
      livery.ts           painted livery for an untextured scan
      materials.ts, textures.ts, types.ts
      thumbnails.ts       renders the roster thumbnails off screen
    backdrop.ts           backdrop photos and where their platform sits
    theme.ts              light/dark resolution and persistence
    language.ts           language resolution and persistence, localized text and numbers
    storage.ts            what the garage remembers (localStorage)
    dom.ts, format.ts     small browser and formatting helpers
  types/
    fleet.ts              Car, Service, profile and scan types, documented field by field
    i18n.ts               Lang, and Text (one string, or one per language)
```

Imports use the `@/` alias for `src/`. Components are PascalCase `.tsx` files; hooks are `use*.ts`. Anything that touches three.js lives under `components/stage/` or `lib/models/`, which only load once the 3D view mounts.

---

## How it works

### Page layout

`Garage.tsx` is the client boundary. It holds the state the parts share (current car, filter, pick, zoom, theme, focus view) and passes each part what it needs; each part handles its own layout effects and animations.

- **Desktop (≥ 1024 px).** The 3D stage is full-bleed behind everything, and two frosted cards float over its left and right edges. `useSideCardInset` measures how much of the stage the cards cover, `Showroom` measures the top hint/title and the bottom toolbar, and together they go to the 3D scene as a `Frame`. The car is then framed in the clear area between them.
- **Tablet and phone.** The stage becomes a grid cell beside the description card. The ratings card moves below, and on phones the toolbar gets its own row.
- **Header.** One row from 768 px up. The filter pills compact themselves below 1536 px. If they still don't fit, they scroll sideways, with faded edges only where pills are hidden.

### The 3D stage (`components/stage/`)

- **Transparent canvas over a photo.** The canvas has no background; the showroom photo is a CSS background behind it. `backdrop.ts` records where the photo's platform ring is: centre `(994, 785)` and radius `592`, in the photo's 2000×1116 pixels. `backdropAnchor()` converts that to screen coordinates for whatever size the stage is.
- **Standing on the platform.** The camera always looks at the car's ground point. `camera.setViewOffset` shifts the projection so that point lands on the ring's centre. The camera is tilted 8.7° (`el = asin(90 / 592)`, from the ring's height-to-width ratio), so the car's perspective matches the photo's. Vertical drag-tilt is locked for that reason.
- **Sizing.** The car is scaled to whichever is tightest: the ring, the gap between the cards (plus room for the ‹ › buttons), or the space under the top overlay. Height is the model's real highest point, so a roof sign or the Model X's open doors stay in frame. Distance and offsets are eased every frame, so changing car, opening focus view or resizing all glide.
- **Zoom.** The photo can't change perspective, so zoom has to keep the car and the photo in step:
  - **Zooming in** magnifies the image around the middle of the car. The camera renders a smaller window of its view (`setViewOffset`), and the photo layer is CSS-scaled by the same factor around the same point, so car and platform grow together.
  - **Zooming out** below 100% backs the camera off instead. The car shrinks on the platform's centre, because shrinking the photo would expose its edges.
  - **Wheel and pinch.** The wheel uses a non-passive listener so it doesn't scroll the page; pinch tracks two pointers.
- **Reflection (`reflection.ts`).** An upside-down copy of the car is rendered with see-through copies of its materials. A shader hook (`fadeBelowDeck`) fades it with depth, like polished stone.
- **Lighting (`lighting.ts`).** Only sketched cars are lit (none in the current fleet); scans are unlit. Hemisphere, key, fill and rim lights, plus a Drei `<Environment>` built from `<Lightformer>`s for reflections. The rim light takes the service's accent colour. `LOOK` holds a night set and a day set, and GSAP tweens between them when the theme changes.
- **Animation.** Cars roll in from the left with spinning wheels (GSAP). Picking a car flashes the glow under it yellow. Camera presets tween the turntable angle the short way round.

### Sketched cars (`lib/outline.ts` → `lib/models/sketchedCar.ts`)

Each car's `profile` (length, height, wheelbase, overhangs, hood/cowl/roof/tail points, lamp sizes and so on) describes its **side view**. `makeOutline()` turns it into rounded polygons: the body, the glasshouse and the window panes. `buildSketchedCar()` extrudes those into a bevelled 3D body. It then adds wheels, lamps, grille, plates, mirrors, roof sign, rails, cladding or chrome, and coach details for buses. The same outline draws the 2D roster placeholders and the no-WebGL fallback (`lib/sideView.ts`).

### Scanned cars (`lib/models/scannedCar.ts`, `livery.ts`)

Every scan, textured or not, goes through the same steps when it loads:

1. **Decode.** The file is decoded with three's Meshopt decoder. Quantised attributes (16-bit positions, 8-bit normals) are unpacked to plain floats, so the next steps can't clip them.
2. **Orient.** It is turned to face +x like the other cars.
3. **Scale.** It is scaled to the car's `profile.L` (length), `profile.H` (roof height, measured away from the roof sign) and `profile.W` (body width, measured in the rear half to skip the mirrors).

What happens next depends on the scan:

- **Textured scan** (all the current scans). It is shown **unlit**: a `MeshBasicMaterial` with the file's colour texture and tone mapping off, so the stage's lights, reflections and theme don't change it and its colours reach the screen exactly as textured. (The file's normal, metalness and roughness maps go unused.)
- **Untextured scan** (no UVs, no materials). It gets smooth normals and the Bluebird Prime livery painted in a fragment shader, by **position on the body**:
  - `u` runs from the front bumper (0) to the rear (1), `v` from the ground (0) to the roof (1), and `az` from the centre line (0) to the side (1).
  - Rules pick out the glass, lamps, plates, wheels (found from where the tyres touch the ground) and roof sign.
  - The "Bluebird PRIME" lettering and swoosh are drawn on a canvas and projected onto each side.
  - Floor-reflection copies re-apply this shader, which `material.clone()` would otherwise drop.

### Roster thumbnails (`lib/models/thumbnails.ts`)

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

Add an entry to `CAR_ENTRIES` in `src/data/cars.ts`. Its position sets the roster order (the first car is the one a first visit opens on):

```ts
{ id: "avanza", service: "bluebird", maker: "Toyota", model: "Avanza", short: "Avanza",
  paint: "#2a86d6", plate: "yellow", sign: "blue",
  blurb: { en: "One or two sentences about this car in the fleet.", id: "Satu atau dua kalimat tentang mobil ini." },
  body: { en: "Compact MPV", id: "MPV kompak" }, seats: "7", power: { en: "Petrol", id: "Bensin" },
  note: { en: "Short fleet note", id: "Catatan singkat armada" },
  ratings: { capacity: 6, comfort: 5, eco: 5, agility: 8 },     // 0–10
  profile: { L: 4.4, W: 1.73, H: 1.7, wb: 2.75, fo: 0.83, ... } }, // side profile, metres
```

| Field | Meaning |
|---|---|
| `id` | Unique; used in `/#id` links and saved state |
| `service` | Service key (see below) |
| `paint` | Body colour |
| `plate` | `"yellow"` (public transport) or `"white"` (private) |
| `sign` | Optional roof sign: `"blue"` or `"silver"` |
| `ratings` | Out of 10: `capacity` (shown as Seats), `comfort`, `eco`, `agility` (city agility) |
| `profile` | Side profile in metres, measured from the front bumper. Anything left out takes `DEFAULT_PROFILE` |
| `blurb`, `body`, `seats`, `power`, `note` | Shown to visitors: `{ en, id }`, or one string when it reads the same in both (a number, `"Sedan"`, `"Diesel"`) |

Every field is documented in `src/types/fleet.ts`. The main profile values:
- **Size:** `L`, `W`, `H` (length, width, height). `L` is also shown on the info card as the car's length, so use the real figure.
- **Wheels:** `wb` (wheelbase), `fo` (front overhang), `wr` (wheel radius), `gc` (ground clearance).
- **Outline points:** `hoodH`, `cowlX/cowlH`, `roofX0/roofX1`, `rearX/rearH`, `tailH`.
- **Glasshouse:** `panes` (side windows), `tumble` (its width as a share of the body's).
- **Lamps and grille:** `tail` (`"v"`, `"bar"` or `"h"`), `hl` (headlamp size, or `"round"`), `gr` (grille size, or `0` for none).
- **Extras (set to `1`):** `rails`, `clad`, `chrome`, `bus`.

The easiest start is to copy a similar car and adjust. The roster, filters, counter and thumbnails pick it up automatically.

**Maker logo.** The info card's footer shows the maker's emblem straight on the card, from `MAKER_LOGOS` in `src/data/makers.ts`, keyed by `maker`. A maker that isn't listed gets its initial instead.
- **Getting one.** [Cardog Icons](https://www.npmjs.com/package/@cardog-icons/core) (MIT, about 50 brands) has most car makers: copy `optimized/<Brand> Icon.svg` from the `@cardog-icons/core` package to `public/logos/<brand>.svg`. Copy the SVG rather than importing `@cardog-icons/react`: that package ships every logo in one file that bundlers can't trim, so even one icon adds about 1 MB (gzipped) to the page.
- **Crop it.** Trim the file's `viewBox` to the emblem itself, so every logo fills the footer slot the same way. A logo that's really a bitmap inside an SVG (as the Hino one was) is better saved as a trimmed WebP about 192 px across.
- **Check it on the dark card.** Black or navy parts disappear there. Add a `dark` version with those parts turned white (`bmw-dark.svg`, `hyundai-dark.svg` and `hino-dark.webp` are examples); it replaces the colour one in the dark theme.

### Add a scanned (GLB) car

1. **Shrink it for the web.** Generated scans are large: the Tripo exports here are 15–27 MB, mostly 4K textures (one is a 10–19 MB PNG). [glTF-Transform](https://gltf-transform.dev/) compresses geometry with Meshopt and converts textures to 2048px WebP:

   ```bash
   npx @gltf-transform/cli optimize input.glb public/models/<service>/your-car.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false
   ```

   Tripo exports have about 100k triangles, so they don't need simplifying; each came out at 1.1–1.4 MB. For a much denser mesh (Meshy exports reached 0.7–1.8 million triangles), replace `--simplify false` with `--simplify-ratio 0.1 --simplify-error 0.001` to keep about a tenth of the vertices. Keep your original; the optimised copy is lossy.
2. **Check the orientation.** The loader uses the first mesh it finds and expects **y up**. `scan.yaw` is the turn that points the nose to +x:
   - Tripo exports put the nose at +z. That's the default (`Math.PI / 2`), so leave `yaw` out.
   - Meshy exports put it at −x. Use `yaw: Math.PI`.
   - If the model shows up backwards, add `Math.PI`.

   Units don't matter (Tripo's are centimetres); the model is scaled to `profile` anyway.

   The loader measures the scan's roof height and body width to scale it. If parts stick out where the body should be (the Model X's open falcon-wing doors, or the Mobilio's wide roof sign), pass the measurements in the scan's own units with `fit: { roof, halfWidth }`.
3. **Add the car** to `src/data/cars.ts` as above, plus `scan: { src: "/models/<service>/your-car.glb" }`, where `<service>` is the car's `service` (keep the file in that folder; if the car changes service, move it too). Set `profile.L`, `profile.H` (roof height, without any roof sign) and `profile.W` (body width, without mirrors) to the real vehicle's size. If they're close to the scan's own proportions, scaling stays nearly uniform and textures don't stretch. The other profile values are only used for the 2D drawing.
4. **Untextured scans only:** the painted livery is the Bluebird Prime design, laid out in `u`/`v`/`az` proportions. Another car usually needs its region numbers adjusted (belt line, A-pillar line, lamp and plate heights, `WHEEL_R`, decal band `D0/D1/E0/E1`). View it from the Front, Side and Rear presets while you tune.

### Add a service

1. Add its key to `ServiceKey` in `src/types/fleet.ts`.
2. Add an entry to `SERVICES` in `src/data/services.ts` (`name`, `role` in both languages, `accent` and `badge`), and the key to `FILTERS` where its pill should go.
3. Add the badge to `public/icons/<name>.png` (transparent, roughly square), and a `public/models/<name>/` folder for its scans.

### Change or add interface text

Every interface string is in `src/i18n/messages.ts`, once for English (`en`) and once for Indonesian (`id`). The Indonesian set is typed against the English one, so adding a string to one and not the other, or misspelling a key, fails the type check. Components read them with `const { t } = useI18n()` (for example `t.ratings.select`); car and service text goes through `text()`, and numbers through `number()`, which writes "4,39" in Indonesian.

The page is prerendered in English and switches to the visitor's language as it hydrates, so an Indonesian first visit can show English for a moment while the page loads.

### Change a service badge

Replace `public/icons/<name>.png`. Trim any transparent margin so the badges match in size; 128×128 works well.

### Change the showroom photos

Both photos must be **framed identically** (same platform position). If you swap them:

1. Find the platform's glowing ring in the photo: its left and right edges on the centre row, and its back and front edges on the centre column.
2. In `src/lib/backdrop.ts`, set `cx`, `cy` (ring centre) and `r` (half the left-to-right width), plus `w` and `h` (photo size).
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

- Bird Garage was created by Hamdi Ranuharja. © 2026 Hamdi Ranuharja.
- Fleet facts (models, launch dates, service history) are from public Bluebird Group announcements and press coverage.
- The showroom photos, service badges and Bluebird icon were supplied for this project. All 16 textured models were generated with Tripo. The BMW 2002 is a showroom piece, not part of Bluebird's recorded fleet.
- Car maker emblems for BMW, BYD, Honda, Hyundai, Tesla and Toyota are from [Cardog Icons](https://www.npmjs.com/package/@cardog-icons/core), MIT © 2024 Cardog; the licence is in `public/logos/LICENSE.txt`. The Denza, Hino and Holden emblems were supplied for this project. The dark-theme versions and crops were made from these. The marks themselves belong to their manufacturers and are used here only to identify each car's maker.
- Bluebird, Silverbird, Goldenbird, Bigbird, Cititrans and related marks belong to PT Blue Bird Tbk. This is an unofficial fan project.
