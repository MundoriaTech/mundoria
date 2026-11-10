import Link from "next/link";

import { FeaturedCleanerCards } from "@/components/marketing/featured-cleaner-cards";
import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { BrandedSection } from "@/components/marketing/branded-page-sections";
import { directoryReviewsToLandingReviews } from "@/lib/marketing/location-review-display";
import type { DirectoryReview } from "@/lib/seo/birmingham-directory";
import {
  birminghamNearbyZone,
  birminghamTownZones,
  coverageAreaHref,
  coverageZoneHref,
  type CoverageLinkFocus,
} from "@/lib/seo/birmingham-coverage";
import { isIndexableAreaSlug } from "@/lib/seo/canonical";
import {
  cleaningPlaceIntro,
  cleaningPlaceTitle,
  surroundingTownsIntro,
} from "@/lib/seo/place-page-focus";

export function LocationNearPlacePills({
  categoryFocus,
  links,
  place,
  placesNote,
  serviceLabel,
  serviceSlug,
  showNearbyTowns = false,
  surroundingLinks,
}: {
  categoryFocus?: CoverageLinkFocus["category"];
  links?: Array<{ href: string; label: string }>;
  place: string;
  placesNote?: string;
  serviceLabel?: string;
  serviceSlug?: string;
  showNearbyTowns?: boolean;
  surroundingLinks?: Array<{ href: string; label: string }>;
}) {
  const focus: CoverageLinkFocus = {
    category: categoryFocus,
    serviceSlug,
  };
  const items = (
    links ??
    birminghamTownZones().map((zone) => ({
      href: coverageZoneHref(zone.id, focus),
      label: zone.label,
    }))
  ).filter((item) => {
    const slug = item.href.split("/").pop()?.split("?")[0];
    return !slug || isIndexableAreaSlug(slug);
  });
  const nearbyZone = birminghamNearbyZone();
  const nearbyPlaces = showNearbyTowns
    ? (nearbyZone?.areas ?? []).map((area) => ({
        href: coverageAreaHref(area, focus),
        label: area.label,
      }))
    : [];
  const heading = cleaningPlaceTitle({
    category: categoryFocus,
    place,
    preposition: "near",
    serviceLabel,
  });
  const intro = [
    cleaningPlaceIntro({
      category: categoryFocus,
      scope: links ? "places" : "towns",
      serviceLabel,
    }),
    placesNote,
  ]
    .filter(Boolean)
    .join(" ");
  const pillClass =
    "inline-flex rounded-full border border-[#e4daf5] bg-white px-4 py-2 text-sm font-semibold text-[#1c133b] transition hover:text-[#6a45b8]";

  const placeList = (
    <ul className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          <Link className={pillClass} href={item.href}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const nearbyList = nearbyPlaces.length ? (
    <div className="mt-10">
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        Nearby towns
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
        {nearbyZone?.note}
      </p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {nearbyPlaces.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link className={pillClass} href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <BrandedSection>
      {surroundingLinks?.length ? (
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
          <div>
            <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
              {heading}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5a5470]">{intro}</p>
            {placeList}
          </div>
          <div>
            <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
              Surrounding towns
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5a5470]">
              {surroundingTownsIntro({
                category: categoryFocus,
                serviceLabel,
              })}
            </p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {surroundingLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link className={pillClass} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            {heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">{intro}</p>
          {placeList}
        </>
      )}
      {nearbyList}
    </BrandedSection>
  );
}

export function LocationFeaturedCleaners({
  bookingHref = "/booking/new",
  cleaners,
  place,
}: {
  bookingHref?: string;
  cleaners: Array<{
    areas: string;
    avatarUrl?: string | null;
    href?: string;
    jobs?: number;
    name: string;
    prefixes?: string[];
    radiusMiles?: number | null;
    rating: number;
    reviewCount?: number;
  }>;
  place: string;
}) {
  if (!cleaners.length) return null;
  return (
    <>
      <BrandedSection tone="cream">
        <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
          Your next cleaner could be right here.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
          Find a vetted cleaner in {place}, with ratings from completed visits.
        </p>
        <FeaturedCleanerCards bookingHref={bookingHref} cleaners={cleaners} />
      </BrandedSection>
    </>
  );
}

/** Location review copy in the homepage carousel layout (not a second UI). */
export function LocationReviews({
  heading,
  place,
  reviews,
}: {
  heading?: string;
  place: string;
  reviews: DirectoryReview[];
}) {
  // Keep the #reviews anchor (hero "Read reviews" link) even before there
  // are local reviews: the section then points to the Google listing only.
  if (!reviews.length) {
    return <ReviewsSection heading={heading ?? "Mundoria customer reviews"} />;
  }

  return (
    <ReviewsSection
      heading={heading ?? `Cleaning reviews in ${place}`}
      reviews={directoryReviewsToLandingReviews(reviews)}
    />
  );
}
