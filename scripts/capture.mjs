// Renders each car's pictures from the running site:
//   public/previews/<id>.jpg   link preview, 1200×630: the car on the showroom platform with its name
//   public/thumbs/<id>.webp    roster thumbnail, 520×260: the 3D model at a front three-quarter angle
//
//   npm run dev                                     (in another terminal; or npm run build && npm start)
//   npm run capture                                 every car, both pictures
//   npm run capture -- limo torana                  just these cars
//   npm run capture -- --previews  (or --thumbs)    just one kind
//
// Previews come from each car's /car/<id>?capture page, which shows only the stage and the car's title in the dark
// theme and marks it data-ready once the model is standing. Thumbnails come from /capture/thumbs, which renders
// them with the garage's own thumbnail renderer. Uses the Chrome or Edge already installed (puppeteer-core doesn't
// download one); set CHROME_PATH to use another, and BASE_URL if the site isn't on localhost:3000.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const executablePath = BROWSERS.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Chrome or Edge found; set CHROME_PATH to one.");
  process.exit(1);
}

const args = process.argv.slice(2);
const kinds = { previews: !args.includes("--thumbs"), thumbs: !args.includes("--previews") };
const wanted = args.filter((a) => !a.startsWith("--"));

// The car ids, read from the fleet data itself (Node runs the TypeScript file directly).
const { CAR_ENTRIES } = await import(new URL("../src/data/cars.ts", import.meta.url).href);
const ids = CAR_ENTRIES.map((c) => c.id).filter((id) => !wanted.length || wanted.includes(id));
const unknown = wanted.filter((id) => !ids.includes(id));
if (unknown.length) console.warn(`Not in the fleet: ${unknown.join(", ")}`);

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  // software WebGL, so it works without a GPU
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--hide-scrollbars"],
});
try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "reduce" }]);

  if (kinds.previews) {
    mkdirSync("public/previews", { recursive: true });
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    for (const id of ids) {
      await page.goto(`${BASE_URL}/car/${id}?capture`, { waitUntil: "networkidle0", timeout: 120_000 });
      await page.waitForSelector("[data-ready]", { timeout: 120_000 });
      await page.evaluate(() => document.fonts.ready);
      // the dev server's Next.js badge isn't part of the picture
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      // let the camera finish easing to the model's real height
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: `public/previews/${id}.jpg`, type: "jpeg", quality: 82 });
      console.log(`public/previews/${id}.jpg`);
    }
  }

  if (kinds.thumbs) {
    mkdirSync("public/thumbs", { recursive: true });
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/capture/thumbs?ids=${ids.join(",")}`, { waitUntil: "networkidle0", timeout: 120_000 });
    await page.waitForSelector("[data-ready]", { timeout: 300_000 });
    const shots = await page.$$eval("img[data-id]", (imgs) => imgs.map((img) => [img.dataset.id, img.src]));
    for (const [id, url] of shots) {
      writeFileSync(`public/thumbs/${id}.webp`, Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
      console.log(`public/thumbs/${id}.webp`);
    }
    const missed = ids.filter((id) => !shots.some(([s]) => s === id));
    if (missed.length) console.warn(`No thumbnail rendered for: ${missed.join(", ")}`);
  }
} finally {
  await browser.close();
}
