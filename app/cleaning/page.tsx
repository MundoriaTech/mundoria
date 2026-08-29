import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import {
  MARKETING_SERVICES,
  categoryMarketingLinks,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Browse CleanScape cleaning services — regular, deep, end-of-tenancy, Airbnb, office, windows and recovery support. Clear pricing and online booking.",
  path: "/cleaning",
  title: "Cleaning Services | CleanScape",
});

export default function CleaningIndexPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const categories = categoryMarketingLinks();
  const popular = popularMarketingServices();

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          description:
            "CleanScape cleaning services for homes, workplaces and short-term rentals.",
          name: "CleanScape Cleaning Services",
          url: absoluteUrl("/cleaning"),
        }}
      />
      <MarketingHero
        description="Every CleanScape service is organised by category with a clear description, starting price guidance and a direct path into booking."
        eyebrow="Services"
        primaryHref={bookingHref}
        primaryLabel="Book a clean"
        secondaryHref="/pricing"
        secondaryLabel="See pricing"
        title="Cleaning services built for clear booking."
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
            Popular services
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((service) => (
              <Link
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
                href={`/cleaning/${service.slug}`}
                key={service.slug}
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {service.categoryLabel}
                </p>
                <h3 className="mt-3 text-xl font-black text-foreground">
                  {service.label}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {service.description}
                </p>
                <p className="mt-4 text-sm font-black text-foreground">
                  From {service.fromPrice}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {categories.map((category) => (
            <div key={category.label}>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
                {category.label}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
                {category.description}
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service) => (
                  <li key={service.href}>
                    <Link
                      className="block rounded-xl border border-border bg-card px-4 py-4 text-sm font-bold text-foreground transition hover:border-primary/40"
                      href={service.href}
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[1.5rem] bg-foreground px-6 py-10 text-background sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              Ready to book?
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-background/70">
              {MARKETING_SERVICES.length} services available online with live
              status, messaging and checklist-led completion.
            </p>
          </div>
          <Button
            asChild
            className="h-12 rounded-full bg-background px-6 font-black text-foreground hover:bg-background/90"
          >
            <Link href={bookingHref}>Start booking</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
