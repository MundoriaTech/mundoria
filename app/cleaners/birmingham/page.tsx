import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description: LAUNCH_CITY.seoDescription,
  path: `/cleaners/${LAUNCH_CITY.slug}`,
  title: "Cleaners in Birmingham | CleanScape",
});

export default function BirminghamCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const popular = popularMarketingServices();

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
                name: "Cleaners in Birmingham",
                position: 2,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Birmingham",
              addressCountry: "GB",
            },
            areaServed: BIRMINGHAM_AREAS.map((area) => ({
              "@type": "Place",
              name: area.name,
            })),
            description: LAUNCH_CITY.seoDescription,
            name: "CleanScape Birmingham",
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
          },
        ]}
      />

      <MarketingHero
        description={LAUNCH_CITY.summary}
        eyebrow="Coverage"
        primaryHref={bookingHref}
        primaryLabel="Book in Birmingham"
        secondaryHref="/cleaning"
        secondaryLabel="Browse services"
        title="Cleaners in Birmingham"
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
            Neighbourhoods we prioritise
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium text-muted-foreground">
            We publish areas where CleanScape aims to fulfil reliably — not
            every West Midlands town at once.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIRMINGHAM_AREAS.map((area) => (
              <Link
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
                href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
                key={area.slug}
              >
                <h3 className="text-xl font-black text-foreground">
                  {area.name}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
            Popular Birmingham cleaning services
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((service) => (
              <Link
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
                href={`/cleaning/${service.slug}`}
                key={service.slug}
              >
                <h3 className="text-lg font-black text-foreground">
                  {service.label} in Birmingham
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  From {service.fromPrice}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
