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
  MARKETING_SERVICES,
  marketingServiceBySlug,
  marketingServicesByCategory,
} from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return MARKETING_SERVICES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  if (!service) return {};
  return buildPageMetadata({
    description: service.seoDescription,
    path: `/cleaning/${service.slug}`,
    title: `${service.label} in the UK | Mundoria`,
  });
}

export default function CleaningServicePage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  if (!service) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? service.bookingHref : "/setup";
  const related = marketingServicesByCategory(service.category)
    .filter((item) => item.slug !== service.slug)
    .slice(0, 4);

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
                item: absoluteUrl("/cleaning"),
                name: "Cleaning services",
                position: 2,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(`/cleaning/${service.slug}`),
                name: service.label,
                position: 3,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: {
              "@type": "City",
              name: "Birmingham",
            },
            description: service.seoDescription,
            name: service.label,
            offers: {
              "@type": "Offer",
              priceCurrency: "GBP",
              availability: "https://schema.org/InStock",
              url: absoluteUrl(`/cleaning/${service.slug}`),
            },
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(`/cleaning/${service.slug}`),
          },
        ]}
      />

      <BrandedPageWash>
        <MarketingHero
          description={service.intro}
          eyebrow={service.categoryLabel}
          primaryHref={bookingHref}
          primaryLabel={`Book ${service.label}`}
          secondaryHref="/cleaners/birmingham"
          secondaryLabel="Birmingham coverage"
          title={`${service.label} with Mundoria`}
        />

        <BrandedSection>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.85fr]">
            <div>
              <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                What’s included in the booking journey
              </h2>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-[#5a5470]">
                <li>
                  Clear service description and recommended cleaning standard
                  where a choice applies.
                </li>
                <li>
                  Property details that feed time and price guidance — not a
                  blank “hours needed” guess.
                </li>
                <li>
                  Live status after booking: matching, arrival, checklist
                  completion and secure payment through the platform.
                </li>
                <li>
                  Starting estimates from {service.fromPrice}, depending on
                  property size, standard, schedule and add-ons.
                </li>
              </ul>
              <Link
                className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-7 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
                href={bookingHref}
              >
                Continue to booking
              </Link>
            </div>
            <aside className="rounded-[1.5rem] border border-[#e4daf5]/80 bg-white/90 p-6 shadow-[0_12px_32px_rgba(49,44,121,0.07)] sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#823fb2]">
                At a glance
              </p>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-[#5a5470]">Category</dt>
                  <dd className="mt-1 font-semibold text-[#1c133b]">
                    {service.categoryLabel}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#5a5470]">From</dt>
                  <dd className="mt-1 font-semibold text-[#1c133b]">
                    {service.fromPrice}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#5a5470]">Launch focus</dt>
                  <dd className="mt-1 font-semibold text-[#1c133b]">
                    Birmingham & nearby areas
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </BrandedSection>

        {related.length ? (
          <BrandedSection tone="cream">
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
              Related {service.categoryLabel.toLowerCase()}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <BrandedCardLink
                  description={`From ${item.fromPrice}`}
                  href={`/cleaning/${item.slug}`}
                  key={item.slug}
                  label={item.label}
                />
              ))}
            </div>
          </BrandedSection>
        ) : null}

        <BrandedCtaBand
          body="Tell us about your space and get a clear estimate before you confirm."
          href={bookingHref}
          label={`Book ${service.label}`}
          title="Ready to book?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
