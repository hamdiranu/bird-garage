import type { FilterKey, Service, ServiceKey } from "@/types/fleet";

/* The group's services, in the order the header filters list them. */

export const SERVICES: Record<ServiceKey, Service> = {
  bluebird: { name: "Bluebird", role: "Regular taxi", accent: "#5db4ff", badge: "/icons/bluebird.png" },
  silverbird: { name: "Silverbird", role: "Executive taxi", accent: "#d5dde8", badge: "/icons/silverbird.png" },
  goldenbird: { name: "Goldenbird", role: "Car rental", accent: "#e2bb63", badge: "/icons/goldenbird.png" },
  bigbird: { name: "Bigbird", role: "Charter", accent: "#43d3c4", badge: "/icons/bigbird.png" },
  cititrans: { name: "Cititrans", role: "Intercity shuttle", accent: "#ff8a5c", badge: "/icons/cititrans.png" },
  // the old outline logo, for retired cars
  heritage: { name: "Heritage", role: "Retired", accent: "#f0dfb8", badge: "/icons/heritage.png" },
};

export const FILTERS: FilterKey[] = ["all", "bluebird", "silverbird", "goldenbird", "bigbird", "cititrans", "heritage"];

/** The badge on a filter pill: "All" wears the group's own Bluebird badge. */
export function filterBadge(filter: FilterKey) {
  return SERVICES[filter === "all" ? "bluebird" : filter].badge;
}
