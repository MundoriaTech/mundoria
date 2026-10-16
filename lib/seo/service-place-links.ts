import {
  birminghamCoverageZoneById,
  birminghamTownZones,
  coverageAreaSlug,
} from "@/lib/seo/birmingham-coverage";
import { servicePlacePath, servicePlaceZonePath } from "@/lib/seo/marketing";

export function serviceTownLinks(serviceSlug: string) {
  return birminghamTownZones().map((zone) => ({
    href: servicePlaceZonePath(serviceSlug, zone.id),
    label: zone.label,
  }));
}

export function serviceInnerPlaceLinks(
  serviceSlug: string,
  zoneId: string,
  exceptSlug?: string,
) {
  const zone = birminghamCoverageZoneById(zoneId);
  if (!zone) return [];
  return zone.areas
    .filter((area) => coverageAreaSlug(area) !== exceptSlug)
    .map((area) => ({
      href: servicePlacePath(serviceSlug, coverageAreaSlug(area)),
      label: area.label,
    }));
}

export function serviceSurroundingTownLinks(
  serviceSlug: string,
  exceptZoneId: string,
) {
  return birminghamTownZones()
    .filter((zone) => zone.id !== exceptZoneId)
    .map((zone) => ({
      href: servicePlaceZonePath(serviceSlug, zone.id),
      label: zone.label,
    }));
}
