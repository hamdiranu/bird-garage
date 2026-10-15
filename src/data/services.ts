import type { FilterKey, Service, ServiceKey } from "@/types/fleet";

/* The group's services, in the order the header filters list them. */

export const SERVICES: Record<ServiceKey, Service> = {
  bluebird: { name: "Bluebird", role: { en: "Regular taxi", id: "Taksi reguler" }, accent: "#5db4ff", badge: "/icons/bluebird.png" },
  silverbird: { name: "Silverbird", role: { en: "Executive taxi", id: "Taksi eksekutif" }, accent: "#d5dde8", badge: "/icons/silverbird.png" },
  goldenbird: { name: "Goldenbird", role: { en: "Car rental", id: "Sewa mobil" }, accent: "#e2bb63", badge: "/icons/goldenbird.png" },
  bigbird: { name: "Bigbird", role: { en: "Charter", id: "Carter" }, accent: "#43d3c4", badge: "/icons/bigbird.png" },
  cititrans: { name: "Cititrans", role: { en: "Intercity shuttle", id: "Shuttle antarkota" }, accent: "#ff8a5c", badge: "/icons/cititrans.png" },
  // the old outline logo, for retired cars
  heritage: { name: "Heritage", role: { en: "Retired", id: "Purnatugas" }, accent: "#f0dfb8", badge: "/icons/heritage.png" },
};

export const FILTERS: FilterKey[] = ["all", "bluebird", "silverbird", "goldenbird", "bigbird", "cititrans", "heritage"];

/** The badge on a filter pill: "All" wears the group's own Bluebird badge. */
export function filterBadge(filter: FilterKey) {
  return SERVICES[filter === "all" ? "bluebird" : filter].badge;
}
