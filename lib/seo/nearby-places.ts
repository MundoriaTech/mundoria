import type { CoverageArea } from "@/lib/seo/birmingham-coverage";

/**
 * Approximate town-centre coordinates for the "Nearby towns" coverage zone.
 * Used only to pick each town's real neighbours for internal links, so a
 * town page lists the places around it instead of the same 32-town list on
 * every page (flagged as repeated boilerplate in the Nov 2026 audit).
 */
const BORDER_PLACE_COORDINATES: Record<string, readonly [number, number]> = {
  Solihull: [52.4130, -1.7780],
  Shirley: [52.4040, -1.8170],
  Olton: [52.4370, -1.8070],
  "Hall Green / Solihull border": [52.4200, -1.8300],
  "Marston Green": [52.4680, -1.7560],
  "Chelmsley Wood": [52.4800, -1.7300],
  "Castle Bromwich": [52.5050, -1.7850],
  "Smith's Wood": [52.4880, -1.7500],
  Kingshurst: [52.4950, -1.7650],
  Fordbridge: [52.4890, -1.7410],
  Bickenhill: [52.4430, -1.7220],
  Elmdon: [52.4520, -1.7380],
  Knowle: [52.3880, -1.7330],
  Dorridge: [52.3730, -1.7520],
  "Hampton-in-Arden": [52.4260, -1.7000],
  Hollywood: [52.3920, -1.8760],
  Wythall: [52.3810, -1.8660],
  "Barnt Green": [52.3600, -1.9970],
  Alvechurch: [52.3510, -1.9650],
  "Cofton Hackett": [52.3710, -1.9870],
  Bromsgrove: [52.3350, -2.0610],
  Smethwick: [52.4930, -1.9680],
  Bearwood: [52.4770, -1.9730],
  Oldbury: [52.5050, -2.0160],
  "West Bromwich": [52.5190, -1.9950],
  "Rowley Regis": [52.4880, -2.0500],
  Halesowen: [52.4490, -2.0500],
  "Cradley Heath": [52.4720, -2.0810],
  Coleshill: [52.4990, -1.7080],
  "Water Orton": [52.5190, -1.7430],
  Walsall: [52.5860, -1.9820],
  Aldridge: [52.6040, -1.9170],
};

function distanceKm(a: readonly [number, number], b: readonly [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * The `limit` places in `areas` closest to `label`, nearest first.
 * Falls back to the original order when coordinates are unknown.
 */
export function nearestCoverageAreas<T extends Pick<CoverageArea, "label">>(
  label: string,
  areas: readonly T[],
  limit = 8,
): T[] {
  const origin = BORDER_PLACE_COORDINATES[label];
  const others = areas.filter((area) => area.label !== label);
  if (!origin) return others.slice(0, limit);
  return others
    .map((area, index) => {
      const point = BORDER_PLACE_COORDINATES[area.label];
      return { area, index, km: point ? distanceKm(origin, point) : Infinity };
    })
    .sort((a, b) => a.km - b.km || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.area);
}
