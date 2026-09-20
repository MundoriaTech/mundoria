import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCardLink,
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  LocationFaqBlock,
  LocationFeaturedCleaners,
  LocationHowToBook,
  LocationReviews,
  LocationServicesExplainer,
  LocationTrustStrip,
  LocationWhatsCovered,
} from "@/components/marketing/location-seo-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  birminghamAreaBySlug,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import {
  BIRMINGHAM_LOCATION_CLEANERS,
  BIRMINGHAM_LOCATION_REVIEWS,
} from "@/lib/seo/location-social-proof";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { area: string };
};

export function generateStaticParams() {
  return BIRMINGHAM_AREAS.map((area) => ({ area: area.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const area = birminghamAreaBySlug(params.area);
  if (!area) return {};
  return buildPageMetadata({
    description: `${area.seoIntro} ${area.description}`,
    path: `/cleaners/${LAUNCH_CITY.slug}/${area.slug}`,
    title: `Cleaners in ${area.name}, Birmingham | Mundoria`,
  });
}

export default function BirminghamAreaPage({ params }: PageProps) {
  const area = birminghamAreaBySlug(params.area);
  if (!area) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const popular = popularMarketingServices(4);
  const otherAreas = BIRMINGHAM_AREAS.filter((item) => item.slug !== area.slug);
  const place = `${area.name}, Birmingham`;
  const localCleaners = BIRMINGHAM_LOCATION_CLEANERS.filter((cleaner) =>
    cleaner.areas.toLowerCase().includes(area.name.split(" ")[0]!.toLowerCase()),
  );
  const featured =
    localCleaners.length >= 3
      ? localCleaners
      : BIRMINGHAM_LOCATION_CLEANERS.slice(0, 6);
  const faqs = [...area.faqs, ...sharedLocationFaqs(place)];

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                item: absoluteUrl("/"),
                name: "Home",
                position: 1,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
                name: "Birmingham",
                position: 2,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
                name: area.name,
                position: 3,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: {
              "@type": "Place",
              name: place,
            },
            description: area.seoIntro,
            name: `Cleaning services in ${area.name}`,
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
              "@type": "Question",
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
              name: item.question,
            })),
          },
        ]}
      />

      <BrandedPageWash>
        <MarketingHero
          description={area.seoIntro}
          eyebrow={`${area.name} · Birmingham`}
          primaryHref={bookingHref}
          primaryLabel={`Book in ${area.name}`}
          secondaryHref={`/cleaners/${LAUNCH_CITY.slug}`}
          secondaryLabel="All Birmingham areas"
          title={`Cleaners in ${area.name}`}
        />

        <LocationTrustStrip />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Why book Mundoria in {area.name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5a5470]">
            {area.description}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {area.highlights.map((item) => (
              <li
                className="rounded-[1.25rem] border border-[#e4daf5]/80 bg-white/90 px-4 py-4 text-sm font-medium leading-6 text-[#1c133b] shadow-[0_8px_22px_rgba(49,44,121,0.05)]"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </BrandedSection>

        <LocationFeaturedCleaners cleaners={[...featured]} place={area.name} />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Looking for something different in cleaning?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {popular.map((service) => (
              <BrandedCardLink
                description={service.description}
                href={`/cleaning/${service.slug}`}
                key={service.slug}
                label={service.label}
                meta={service.categoryLabel}
              />
            ))}
          </div>
        </BrandedSection>

        <LocationReviews
          place={area.name}
          reviews={[...BIRMINGHAM_LOCATION_REVIEWS]}
        />

        <LocationServicesExplainer place={place} />
        <LocationWhatsCovered place={place} />
        <LocationHowToBook place={place} />
        <LocationFaqBlock extraFaqs={area.faqs} place={place} />

        <BrandedSection tone="lavender">
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-xl">
            Domestic cleaners near {area.name}
          </h2>
          <p className="mt-2 text-sm text-[#5a5470]">
            Mundoria pros are available in these towns and their surroundings:
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherAreas.map((item) => (
              <li key={item.slug}>
                <Link
                  className="block rounded-[1.15rem] border border-[#e4daf5]/80 bg-white/85 px-4 py-4 text-sm font-semibold text-[#1c133b] shadow-[0_8px_22px_rgba(49,44,121,0.05)] transition hover:-translate-y-0.5 hover:text-[#6a45b8]"
                  href={`/cleaners/${LAUNCH_CITY.slug}/${item.slug}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </BrandedSection>

        <BrandedCtaBand
          body={`Book cleaning in ${area.name} with a clear estimate and live status.`}
          href={bookingHref}
          label={`Book in ${area.name}`}
          title={`Need a cleaner in ${area.name}?`}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}

function sharedLocationFaqs(place: string) {
  return [
    {
      answer: `Mundoria offers regular cleaning, one-off and deep cleans, end-of-tenancy / move cleans, Airbnb & short-let turnovers, commercial cleans and Mundoria Recovery support across ${place}.`,
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
  ];
}
