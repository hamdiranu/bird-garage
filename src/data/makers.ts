import type { MakerLogo } from "@/types/fleet";

/** Each maker's emblem, keyed by `Car.maker`, plus a `dark` version where the colour one would vanish on the dark
    card (black or navy parts turned white). BMW, BYD, Honda, Hyundai, Tesla and Toyota are from Cardog Icons; Denza,
    Hino and Holden were supplied for this project; Bigbird is the group's own badge. A maker missing here shows its
    initial instead. */
export const MAKER_LOGOS: Partial<Record<string, MakerLogo>> = {
  BMW: { src: "/logos/bmw.svg", dark: "/logos/bmw-dark.svg" },
  BYD: { src: "/logos/byd.svg" },
  Denza: { src: "/logos/denza.svg" },
  "Hino RM280": { src: "/logos/hino.webp", dark: "/logos/hino-dark.webp" },
  Holden: { src: "/logos/holden.svg" },
  Honda: { src: "/logos/honda.svg" },
  Hyundai: { src: "/logos/hyundai.svg", dark: "/logos/hyundai-dark.svg" },
  Tesla: { src: "/logos/tesla.svg" },
  Toyota: { src: "/logos/toyota.svg" },
  Bigbird: { src: "/icons/bigbird.png" },
};
