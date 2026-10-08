/* Light/dark theme: the saved choice, else the system setting. Shared by the pre-paint script in the
   layout and by the client, so both always agree. */
export type Theme = "dark" | "light";
export const THEME_KEY = "bluebird-theme";

export function resolveTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
    return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(t: Theme, save = false) {
  document.documentElement.dataset.theme = t;
  if (save) try { localStorage.setItem(THEME_KEY, t); } catch {}
}

/** The same lookup as resolveTheme, as a string for the inline <head> script. */
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`;
