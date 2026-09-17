import type { Metadata } from "next";
import Link from "next/link";

import {
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
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria pricing guidance for regular, deep, end-of-tenancy, Airbnb and office cleaning. See starting prices and book online with a clear estimate.",
  path: "/pricing",
  title: "Cleaning Prices | Mundoria",
});

export default function PricingPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const featured = popularMarketingServices(8);

  return (
    <MarketingShell>
      <BrandedPageWash>
        <MarketingHero
          description="Estimates are shown before checkout. Final price depends on service, cleaning standard, property size, schedule and add-ons — never a surprise fee after you book."
          eyebrow="Pricing"
          primaryHref={bookingHref}
          primaryLabel="Get my price"
          secondaryHref="/cleaning"
          secondaryLabel="Browse services"
          title="Clear cleaning prices"
        />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Starting prices
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
            “From” prices are service baselines. Your booking flow calculates a
            fuller estimate for your property.
          </p>
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#e4daf5]/80 bg-white/90 shadow-[0_12px_32px_rgba(49,44,121,0.06)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#efe6ff]/80">
                <tr>
                  <th className="px-5 py-4 font-semibold text-[#1c133b]">
                    Service
                  </th>
                  <th className="px-5 py-4 font-semibold text-[#1c133b]">
                    Category
                  </th>
                  <th className="px-5 py-4 font-semibold text-[#1c133b]">From</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((service) => (
                  <tr className="border-t border-[#eee8f7]" key={service.slug}>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-[#1c133b] transition hover:text-[#6a45b8]"
                        href={`/cleaning/${service.slug}`}
                      >
                        {service.label}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[#5a5470]">
                      {service.categoryLabel}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#1c133b]">
                      {service.fromPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs font-medium text-[#5a5470]">
            Showing popular services. Full catalogue: {MARKETING_SERVICES.length}{" "}
            services.
          </p>
        </BrandedSection>

        <BrandedCtaBand
          body="Tell us about your space and we’ll calculate a clear estimate before checkout."
          href={bookingHref}
          label="Calculate my estimate"
          title="Want your exact price?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
