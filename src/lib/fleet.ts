import { CAR_ENTRIES, DEFAULT_PROFILE } from "@/data/cars";
import type { Car, FilterKey, ProfileParams, RatingKey } from "@/types/fleet";
import { makeOutline } from "./outline";

/* The fleet ready to show: every car with its full profile and outline, plus the lookups the UI needs. */

export const CARS: Car[] = CAR_ENTRIES.map((entry) => {
  const profile = { ...DEFAULT_PROFILE, ...entry.profile } as ProfileParams;
  return { ...entry, profile, outline: makeOutline(profile) };
});

/** The ratings, in the order the ratings card lists them. */
export const RATINGS: { key: RatingKey; label: string }[] = [
  { key: "capacity", label: "Seats" },
  { key: "comfort", label: "Comfort" },
  { key: "eco", label: "Eco" },
  { key: "agility", label: "City agility" },
];

/** Mean of a car's ratings, out of 10. */
export function overallRating(car: Car) {
  return RATINGS.reduce((sum, { key }) => sum + car.ratings[key], 0) / RATINGS.length;
}

export function matchesFilter(car: Car, filter: FilterKey) {
  return filter === "all" || car.service === filter;
}

/** Indexes into CARS of the cars a filter shows, in roster order. */
export function carsInFilter(filter: FilterKey) {
  return CARS.flatMap((car, i) => (matchesFilter(car, filter) ? [i] : []));
}

export function findCar(id: string) {
  return CARS.findIndex((car) => car.id === id);
}
