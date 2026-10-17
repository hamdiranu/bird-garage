/* Sharing a car. The link goes to /car/<id>, a page that opens the garage on that car and carries a preview
   picture of it for chat apps and social sites. (The older /#<id> links still open the car too.) */

export const carPath = (id: string) => `/car/${id}`;

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** The phone's share sheet on touch screens that have one; elsewhere the link is copied. */
export async function shareLink(url: string, title: string): Promise<ShareResult> {
  if (navigator.share && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // otherwise fall through and copy it
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return copyByHand(url) ? "copied" : "failed";
  }
}

/** The pre-clipboard-API way, for browsers that refuse writeText (e.g. outside a secure context). */
function copyByHand(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.append(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
