import {
  birminghamCoverageZoneById,
  birminghamTownZones,
  coverageAreaHref,
  coverageAreaSlug,
  coverageZoneHref,
} from "@/lib/seo/birmingham-coverage";

/** Town / zone hubs for a service focus on place pages (not legacy service×geo URLs). */
export function serviceTownLinks(serviceSlug: string) {
  return birminghamTownZones().map((zone) => ({
    href: coverageZoneHref(zone.id, { serviceSlug }),
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
      href: coverageAreaHref(area, { serviceSlug }),
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
      href: coverageZoneHref(zone.id, { serviceSlug }),
      label: zone.label,
    }));
}
