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
    title: `${service.label} in the UK | CleanScape`,
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
              name: "CleanScape",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(`/cleaning/${service.slug}`),
          },
        ]}
      />

      <MarketingHero
        description={service.intro}
        eyebrow={service.categoryLabel}
        primaryHref={bookingHref}
        primaryLabel={`Book ${service.label}`}
        secondaryHref="/cleaners/birmingham"
        secondaryLabel="Birmingham coverage"
        title={`${service.label} with CleanScape`}
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
              What’s included in the booking journey
            </h2>
            <ul className="mt-6 space-y-4 text-sm font-medium leading-7 text-muted-foreground">
              <li>
                Clear service description and recommended cleaning standard
                where a choice applies.
              </li>
              <li>
                Property details that feed time and price guidance — not a blank
                “hours needed” guess.
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
            <Button
              asChild
              className="mt-8 h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
            >
              <Link href={bookingHref}>Continue to booking</Link>
            </Button>
          </div>
          <aside className="rounded-[1.5rem] border border-border bg-muted/40 p-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">
              At a glance
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-muted-foreground">Category</dt>
                <dd className="mt-1 font-black text-foreground">
                  {service.categoryLabel}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">From</dt>
                <dd className="mt-1 font-black text-foreground">
                  {service.fromPrice}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Launch focus</dt>
                <dd className="mt-1 font-black text-foreground">
                  Birmingham & nearby areas
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="border-t border-border bg-card px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
              Related {service.categoryLabel.toLowerCase()}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  className="rounded-2xl border border-border p-5 transition hover:border-primary/40"
                  href={`/cleaning/${item.slug}`}
                  key={item.slug}
                >
                  <p className="font-black text-foreground">{item.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    From {item.fromPrice}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </MarketingShell>
  );
}
