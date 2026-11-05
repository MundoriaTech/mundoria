import { notFound, permanentRedirect } from "next/navigation";

import {
  BIRMINGHAM_NEARBY_ZONE_ID,
  birminghamCompoundZoneIds,
  birminghamCoverageZoneById,
  coverageFocusSearch,
  coverageZonePath,
} from "@/lib/seo/birmingham-coverage";
import { readPlacePageFocus } from "@/lib/seo/place-page-focus";

type PageProps = {
  params: { zone: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

export function generateStaticParams() {
  return birminghamCompoundZoneIds().map((zone) => ({ zone }));
}

/**
 * Legacy compound-zone URLs (`/wider/west`, etc.).
 * Permanent-redirect to readable hubs (`/edgbaston-and-harborne`, …).
 */
export default function BirminghamWiderZoneRedirect({
  params,
  searchParams,
}: PageProps) {
  const zone = birminghamCoverageZoneById(params.zone);
  if (!zone || zone.id === BIRMINGHAM_NEARBY_ZONE_ID) notFound();
  if (!birminghamCompoundZoneIds().includes(zone.id)) notFound();

  const focus = readPlacePageFocus(searchParams ?? {});
  permanentRedirect(
    `${coverageZonePath(zone.id)}${coverageFocusSearch(focus)}`,
  );
}
