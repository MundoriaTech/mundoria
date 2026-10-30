import Link from "next/link";

import { FeaturedCleanerCards } from "@/components/marketing/featured-cleaner-cards";
import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { BrandedSection } from "@/components/marketing/branded-page-sections";
import { directoryReviewsToLandingReviews } from "@/lib/marketing/location-review-display";
import type { DirectoryReview } from "@/lib/seo/birmingham-directory";
import {
  PlaceServiceExplainerIntro,
  PlaceServiceExplainerList,
} from "@/components/marketing/place-service-explainer-list";
import { houseCleanCoveredPoints } from "@/lib/seo/birmingham-place-faqs";
import {
  birminghamNearbyZone,
  birminghamTownZones,
  coverageAreaHref,
  coverageZoneHref,
  type CoverageLinkFocus,
} from "@/lib/seo/birmingham-coverage";
import {
  cleaningPlaceIntro,
  cleaningPlaceTitle,
  surroundingTownsIntro,
} from "@/lib/seo/place-page-focus";

const LOCATION_FAQS = (place: string) =>
  [
    {
      answer: `Mundoria offers regular cleaning, one-off and deep cleans, end-of-tenancy / move cleans, Airbnb & short-let turnovers, commercial cleans and recovery cleaning across ${place}.`,
      question: `What cleaning services does Mundoria offer in ${place}?`,
    },
    {
      answer:
        "Enter your postcode, choose a service and cleaning standard, set duration and schedule, then pay securely. We match a suitable cleaner and keep you updated through arrival and completion.",
      question: `How do I book a home cleaning session in ${place}?`,
    },
    {
      answer:
        "Estimates depend on service, property size, cleaning standard, schedule and add-ons. You’ll see a clear price before checkout — never a surprise fee after you book.",
      question: `How much is a Mundoria cleaner in ${place}?`,
    },
    {
      answer:
        "You can use your own products and equipment, or add Mundoria product and equipment supply in booking. Share fragrance-free or Recovery preferences in the booking notes.",
      question: "Do I need to provide cleaning supplies?",
    },
    {
      answer:
        "Cleaners on Mundoria are independent contractors who complete onboarding, identity checks and document review before going live. Payment is held securely and captured after the job.",
      question: "Are Mundoria cleaners vetted?",
    },
    {
      answer:
        "Free cancellation more than 24 hours before the visit; within 24 hours the full booking amount is retained. Exact fees are confirmed in your booking.",
      question: "What is the Mundoria cancellation policy?",
    },
  ] as const;

export function LocationServicesExplainer({ place }: { place: string }) {
  return (
    <BrandedSection tone="cream">
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        What cleaning services does Mundoria offer in {place}?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a5470] sm:text-[15px] sm:leading-7">
        <PlaceServiceExplainerIntro place={place} />
      </p>
      <div className="mt-4 max-w-3xl text-[#5a5470] [&_li]:text-[#5a5470]">
        <PlaceServiceExplainerList place={place} />
      </div>
    </BrandedSection>
  );
}

export function LocationWhatsCovered({ place }: { place: string }) {
  return (
    <BrandedSection>
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        What’s covered in a Mundoria house clean in {place}?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a5470]">
        Exact scope depends on your service and cleaning standard. Typical
        residential visits include:
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-[#5a5470]">
        {houseCleanCoveredPoints().map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </BrandedSection>
  );
}

export function LocationHowToBook({
  bookingHref = "/booking/new",
  place,
}: {
  bookingHref?: string;
  place: string;
}) {
  const steps = [
    <>
      Open{" "}
      <Link
        className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
        href={bookingHref}
      >
        Mundoria booking
      </Link>{" "}
      and enter your postcode in {place}
    </>,
    "Choose your service and cleaning standard",
    "Add property details, duration and any add-ons",
    "Pick a date and time that works for you",
    "Pay securely — we hold payment until the clean is done",
  ];
  return (
    <BrandedSection tone="lavender">
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        How do I book a cleaner in {place}?
      </h2>
      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li
            className="flex gap-3 text-sm leading-6 text-[#5a5470]"
            key={index}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="[&_a]:font-semibold [&_a]:text-[#6a45b8] [&_a]:underline-offset-2 [&_a]:hover:underline">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </BrandedSection>
  );
}

export function LocationFaqBlock({
  extraFaqs = [],
  place,
}: {
  extraFaqs?: Array<{ answer: string; question: string }>;
  place: string;
}) {
  const faqs = [...extraFaqs, ...LOCATION_FAQS(place)];
  return (
    <BrandedSection>
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        Frequently asked questions — {place}
      </h2>
      <div className="mt-8 space-y-3">
        {faqs.map((item) => (
          <details
            className="group rounded-[1.25rem] border border-[#e4daf5]/80 bg-white/90 px-5 py-4 shadow-[0_8px_22px_rgba(49,44,121,0.05)]"
            key={item.question}
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#1c133b] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="text-[#823fb2] transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-[#5a5470]">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#5a5470]">
        More answers in our{" "}
        <Link
          className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
          href="/faq"
        >
          FAQ
        </Link>{" "}
        and{" "}
        <Link
          className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
          href="/help"
        >
          Help Centre
        </Link>
        .
      </p>
    </BrandedSection>
  );
}

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
  categoryFocus?: "commercial" | "recovery" | "residential";
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
  const items =
    links ??
    birminghamTownZones().map((zone) => ({
      href: coverageZoneHref(zone.id, focus),
      label: zone.label,
    }));
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
          Independent cleaners near {place}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
          Vetted independent cleaners covering {place}, with ratings from
          completed visits.
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
  if (!reviews.length) return null;

  return (
    <ReviewsSection
      heading={heading ?? `Cleaning reviews in ${place}`}
      reviews={directoryReviewsToLandingReviews(reviews)}
    />
  );
}
