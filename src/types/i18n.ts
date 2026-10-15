/** The languages the garage is written in. */
export type Lang = "en" | "id";

/** Text shown to visitors: one string when it reads the same in every language (numbers, names), otherwise one
    per language. */
export type Text = string | Record<Lang, string>;
