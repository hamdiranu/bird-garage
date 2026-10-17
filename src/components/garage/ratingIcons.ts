import type { IconName } from "@/components/ui/Icon";
import type { RatingKey } from "@/types/fleet";

/** The icon beside each rating, on the ratings card and in compare mode. */
export const RATING_ICON: Record<RatingKey, IconName> = { capacity: "seat", comfort: "sofa", eco: "leaf", agility: "city" };
