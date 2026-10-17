import { CAR_ENTRIES, DEFAULT_PROFILE } from "@/data/cars";
import type { Car, FilterKey, Power, ProfileParams, RatingKey, SortKey } from "@/types/fleet";
import { makeOutline } from "./outline";

/* The fleet ready to show: every car with its full profile and outline, plus the lookups the UI needs. */

export const CARS: Car[] = CAR_ENTRIES.map((entry) => {
  const profile = { ...DEFAULT_PROFILE, ...entry.profile } as ProfileParams;
  return { ...entry, profile, outline: makeOutline(profile) };
});

/** The ratings, in the order the ratings card lists them (their labels are in i18n/messages.ts). */
export const RATING_KEYS: RatingKey[] = ["capacity", "comfort", "eco", "agility"];

/** Mean of a car's ratings, out of 10. */
export function overallRating(car: Car) {
  return RATING_KEYS.reduce((sum, key) => sum + car.ratings[key], 0) / RATING_KEYS.length;
}

export function matchesFilter(car: Car, filter: FilterKey) {
  return filter === "all" || car.service === filter;
}

/** The roster orders, as the sort menu lists them (their labels are in i18n/messages.ts). */
export const SORT_KEYS: SortKey[] = ["fleet", "rating", "seats", "electric"];

const POWER_ORDER: Record<Power, number> = { electric: 0, petrol: 1, diesel: 2 };

/** What each order sorts by, smallest first. "Most seats" goes by the Seats rating, since some cars list a range. */
const SORT_BY: Record<Exclude<SortKey, "fleet">, (car: Car) => number> = {
  rating: (car) => -overallRating(car),
  seats: (car) => -car.ratings.capacity,
  electric: (car) => POWER_ORDER[car.power],
};

/** Indexes into CARS of the cars a filter shows, in the chosen order. Ties keep roster order. */
export function carsInFilter(filter: FilterKey, sort: SortKey = "fleet") {
  const shown = CARS.flatMap((car, i) => (matchesFilter(car, filter) ? [i] : []));
  if (sort === "fleet") return shown;
  const by = SORT_BY[sort];
  return shown.sort((a, b) => by(CARS[a]) - by(CARS[b]) || a - b);
}

export function findCar(id: string) {
  return CARS.findIndex((car) => car.id === id);
}
