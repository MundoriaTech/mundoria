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
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  birminghamAreaBySlug,
  popularMarketingServices,
} from "@/lib/seo/marketing";
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
    description: `Book cleaners in ${area.name}, Birmingham with Mundoria. ${area.description}`,
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
              name: `${area.name}, Birmingham`,
            },
            description: area.description,
            name: `Cleaning services in ${area.name}`,
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
          },
        ]}
      />

      <BrandedPageWash>
        <MarketingHero
          description={area.description}
          eyebrow={`${area.name} · Birmingham`}
          primaryHref={bookingHref}
          primaryLabel={`Book in ${area.name}`}
          secondaryHref={`/cleaners/${LAUNCH_CITY.slug}`}
          secondaryLabel="All Birmingham areas"
          title={`Cleaners in ${area.name}`}
        />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Services customers book in {area.name}
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
          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-7 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
            href={bookingHref}
          >
            Check availability
          </Link>
        </BrandedSection>

        <BrandedSection tone="lavender">
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-xl">
            Nearby Birmingham areas
          </h2>
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
