import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCardLink,
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  LocationFeaturedCleaners,
  LocationReviews,
} from "@/components/marketing/location-seo-sections";
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  reviewsOrFallback,
} from "@/lib/seo/birmingham-directory";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  type MarketingArea,
  type MarketingService,
  publicMarketingServices,
  servicePlaceFaqs,
  servicePlacePath,
} from "@/lib/seo/marketing";
import {
  SERVICE_GUIDE_TOPICS,
  serviceGuide,
  serviceGuidePath,
} from "@/lib/seo/service-guides";
import { absoluteUrl } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export async function ServicePlacePage({
  area,
  service,
}: {
  area: MarketingArea | null;
  service: MarketingService;
}) {
  const place = area ? area.name : LAUNCH_CITY.name;
  const placeLabel = area ? `${area.name}, Birmingham` : "Birmingham";
  const path = servicePlacePath(service.slug, area?.slug);
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? service.bookingHref : "/setup";
  const faqs = servicePlaceFaqs(service, place);
  const siblings = publicMarketingServices().filter(
    (item) => item.category === service.category && item.slug !== service.slug,
  );
  const otherAreas = area
    ? BIRMINGHAM_AREAS.filter((item) => item.slug !== area.slug)
    : BIRMINGHAM_AREAS;
  const cleaners = await loadDirectoryCleaners({
    areaSlug: area?.slug,
    limit: 6,
    serviceType: service.value,
  });
  const reviews = reviewsOrFallback(
    await loadDirectoryReviews({
      areaSlug: area?.slug,
      limit: 4,
    }),
  );

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
                item: absoluteUrl(`/cleaning/${service.slug}`),
                name: service.label,
                position: 2,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(servicePlacePath(service.slug)),
                name: "Birmingham",
                position: 3,
              },
              ...(area
                ? [
                    {
                      "@type": "ListItem",
                      item: absoluteUrl(path),
                      name: area.name,
                      position: 4,
                    },
                  ]
                : []),
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: {
              "@type": "Place",
              name: placeLabel,
            },
            description: service.description,
            name: `${service.label} in ${placeLabel}`,
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/InStock",
              priceCurrency: "GBP",
              url: absoluteUrl(path),
            },
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(path),
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

      <BrandedPageWash underNav>
        <MarketingHero
          description={`${service.description} Book ${service.label.toLowerCase()} in ${placeLabel} from ${service.fromPrice}, with a clear estimate before you pay.`}
          eyebrow={area ? `${area.name} · Birmingham` : "Birmingham"}
          primaryHref={bookingHref}
          primaryLabel={`Book ${service.label}`}
          secondaryHref={
            area
              ? `/cleaners/${LAUNCH_CITY.slug}/${area.slug}`
              : `/cleaners/${LAUNCH_CITY.slug}`
          }
          secondaryLabel={area ? `Cleaners in ${area.name}` : "Cleaners in Birmingham"}
          title={`${service.label} in ${place}`}
          underNav
        />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            {service.label} in {placeLabel}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5a5470]">
            {area ? area.seoIntro : LAUNCH_CITY.summary} Starting estimates for{" "}
            {service.label.toLowerCase()} are from {service.fromPrice}, then
            sized to the property, standard and any add-ons.
          </p>
          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-7 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
            href={bookingHref}
          >
            Book in {place}
          </Link>
        </BrandedSection>

        {cleaners?.length ? (
          <LocationFeaturedCleaners cleaners={cleaners} place={place} />
        ) : null}

        <BrandedSection tone="cream">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Guides for {service.label.toLowerCase()} in Birmingham
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {SERVICE_GUIDE_TOPICS.map((topic) => {
              const guide = serviceGuide(service, topic);
              return (
                <BrandedCardLink
                  description={guide.description}
                  href={serviceGuidePath(service.slug, topic)}
                  key={topic}
                  label={guide.title}
                />
              );
            })}
          </div>
        </BrandedSection>

        {siblings.length ? (
          <BrandedSection tone="cream">
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
              Other {service.categoryLabel.toLowerCase()} in {place}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((item) => (
                <BrandedCardLink
                  description={`From ${item.fromPrice}`}
                  href={servicePlacePath(item.slug, area?.slug)}
                  key={item.slug}
                  label={`${item.label} in ${place}`}
                  meta={item.categoryLabel}
                />
              ))}
            </div>
          </BrandedSection>
        ) : null}

        <BrandedSection tone="lavender">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            {service.label} in nearby Birmingham areas
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {area ? (
              <li>
                <Link
                  className="block rounded-[1.15rem] border border-[#e4daf5]/80 bg-white/85 px-4 py-4 text-sm font-semibold text-[#1c133b] shadow-[0_8px_22px_rgba(49,44,121,0.05)] transition hover:-translate-y-0.5 hover:text-[#6a45b8]"
                  href={servicePlacePath(service.slug)}
                >
                  {service.label} in Birmingham
                </Link>
              </li>
            ) : null}
            {otherAreas.map((item) => (
              <li key={item.slug}>
                <Link
                  className="block rounded-[1.15rem] border border-[#e4daf5]/80 bg-white/85 px-4 py-4 text-sm font-semibold text-[#1c133b] shadow-[0_8px_22px_rgba(49,44,121,0.05)] transition hover:-translate-y-0.5 hover:text-[#6a45b8]"
                  href={servicePlacePath(service.slug, item.slug)}
                >
                  {service.label} in {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </BrandedSection>

        <LocationReviews place={place} reviews={reviews} />

        <BrandedSection>
          {faqs.map((item) => (
            <div className="mt-8 first:mt-0" key={item.question}>
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                {item.question}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5a5470]">
                {item.answer}
              </p>
            </div>
          ))}
          <p className="mt-8 text-sm text-[#5a5470]">
            More answers in the{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/help"
            >
              Help Centre
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedCtaBand
          body={`Book ${service.label.toLowerCase()} in ${placeLabel} and see the price before you confirm.`}
          href={bookingHref}
          label={`Book ${service.label}`}
          title={`${service.label} in ${place}`}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
