import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  birminghamCoverageZoneById,
  birminghamTownZones,
  coverageAreaHref,
  coverageFocusSearch,
  coverageZoneHref,
} from "@/lib/seo/birmingham-coverage";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  readPlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { zone: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

export function generateStaticParams() {
  return birminghamTownZones().map((zone) => ({ zone: zone.id }));
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  const zone = birminghamCoverageZoneById(params.zone);
  if (!zone) return {};
  const focus = readPlacePageFocus(searchParams ?? {});
  const title = cleaningPlaceTitle({
    category: focus.category,
    place: zone.label,
    preposition: "in",
    serviceLabel: focus.serviceLabel,
  });
  return buildPageMetadata({
    description: zone.note
      ? `${zone.note} Book with Mundoria and see the price before you pay.`
      : `${title}. Book with Mundoria and see the price before you pay.`,
    path: coverageZoneHref(zone.id),
    title: `${title} | Mundoria`,
  });
}

export default function BirminghamWiderAreaPage({
  params,
  searchParams,
}: PageProps) {
  const zone = birminghamCoverageZoneById(params.zone);
  if (!zone) notFound();
  const focus = readPlacePageFocus(searchParams ?? {});
  if (zone.id === "border") {
    permanentRedirect(`/cleaners/birmingham${coverageFocusSearch(focus)}`);
  }
  const bookingHref = bookingHrefForFocus(hasSupabasePublicConfig(), focus);

  return (
    <CityLocationPage
      bookingHref={bookingHref}
      focus={focus}
      name={zone.label}
      path={coverageZoneHref(zone.id, focus)}
      placeLinks={zone.areas.map((area) => ({
        href: coverageAreaHref(area, focus),
        label: area.label,
      }))}
      placesNote={zone.note}
      serviceCardLocation={{ kind: "zone", id: zone.id }}
      surroundingLinks={birminghamTownZones()
        .filter((item) => item.id !== zone.id)
        .map((item) => ({
        href: coverageZoneHref(item.id, focus),
        label: item.label,
      }))}
    />
  );
}
