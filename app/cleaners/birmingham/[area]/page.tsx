import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
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
    description: `Book cleaners in ${area.name}, Birmingham with CleanScape. ${area.description}`,
    path: `/cleaners/${LAUNCH_CITY.slug}/${area.slug}`,
    title: `Cleaners in ${area.name}, Birmingham | CleanScape`,
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
              name: "CleanScape",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
          },
        ]}
      />

      <MarketingHero
        description={area.description}
        eyebrow={`${area.name} · Birmingham`}
        primaryHref={bookingHref}
        primaryLabel={`Book in ${area.name}`}
        secondaryHref={`/cleaners/${LAUNCH_CITY.slug}`}
        secondaryLabel="All Birmingham areas"
        title={`Cleaners in ${area.name}`}
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
            Services customers book in {area.name}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {popular.map((service) => (
              <Link
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
                href={`/cleaning/${service.slug}`}
                key={service.slug}
              >
                <h3 className="text-lg font-black text-foreground">
                  {service.label}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
          <Button
            asChild
            className="mt-8 h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
          >
            <Link href={bookingHref}>Check availability</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-black text-foreground">
            Nearby Birmingham areas
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherAreas.map((item) => (
              <li key={item.slug}>
                <Link
                  className="block rounded-xl border border-border bg-card px-4 py-4 text-sm font-bold text-foreground transition hover:border-primary/40"
                  href={`/cleaners/${LAUNCH_CITY.slug}/${item.slug}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
