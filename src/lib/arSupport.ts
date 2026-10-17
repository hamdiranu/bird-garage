/* Whether this device can stand a car in the room around it, and how. iPhones and iPads open a USDZ file in AR
   Quick Look; Android phones with ARCore run a WebXR session in the browser. This check has no three.js in it, so
   it can run on page load; the AR code itself (lib/ar.ts) loads only when the button is pressed. */

export type ARMode = "quicklook" | "webxr";

export async function detectAR(): Promise<ARMode | null> {
  try {
    // Safari says yes; Chrome says no; Firefox throws, since links have no defined rel tokens to check against.
    if (document.createElement("a").relList?.supports?.("ar")) return "quicklook";
  } catch {}
  try {
    if (await navigator.xr?.isSessionSupported("immersive-ar")) return "webxr";
  } catch {}
  return null;
}
