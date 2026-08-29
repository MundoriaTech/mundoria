import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import {
  MARKETING_SERVICES,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "CleanScape pricing guidance for regular, deep, end-of-tenancy, Airbnb and office cleaning. See starting prices and book online with a clear estimate.",
  path: "/pricing",
  title: "Cleaning Prices | CleanScape",
});

export default function PricingPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const featured = popularMarketingServices(8);

  return (
    <MarketingShell>
      <MarketingHero
        description="Estimates are shown before checkout. Final price depends on service, cleaning standard, property size, schedule and add-ons — never a surprise fee after you book."
        eyebrow="Pricing"
        primaryHref={bookingHref}
        primaryLabel="Get my price"
        secondaryHref="/cleaning"
        secondaryLabel="Browse services"
        title="Clear cleaning prices"
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-foreground">
            Starting prices
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium text-muted-foreground">
            “From” prices are service baselines. Your booking flow calculates a
            fuller estimate for your property.
          </p>
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-5 py-4 font-black text-foreground">Service</th>
                  <th className="px-5 py-4 font-black text-foreground">Category</th>
                  <th className="px-5 py-4 font-black text-foreground">From</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((service) => (
                  <tr className="border-t border-border" key={service.slug}>
                    <td className="px-5 py-4">
                      <Link
                        className="font-bold text-foreground hover:text-primary"
                        href={`/cleaning/${service.slug}`}
                      >
                        {service.label}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {service.categoryLabel}
                    </td>
                    <td className="px-5 py-4 font-black text-foreground">
                      {service.fromPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Showing popular services. Full catalogue: {MARKETING_SERVICES.length}{" "}
            services.
          </p>
          <Button
            asChild
            className="mt-8 h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
          >
            <Link href={bookingHref}>Calculate my estimate</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
