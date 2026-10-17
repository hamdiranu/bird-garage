import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/i18n/I18nProvider";

/* Test helpers (used only by the __tests__ folders). */

/** Render inside the language provider, in English unless `lang` says otherwise, with a user-event session. */
export function renderUI(ui: ReactElement, { lang = "en" }: { lang?: "en" | "id" } = {}) {
  localStorage.setItem("bluebird-lang", lang);
  return { user: userEvent.setup(), ...render(<I18nProvider>{ui}</I18nProvider>) };
}
