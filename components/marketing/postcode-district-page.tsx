import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  LocationFeaturedCleaners,
  LocationReviews,
} from "@/components/marketing/location-seo-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  reviewsOrFallback,
} from "@/lib/seo/birmingham-directory";
import {
  LAUNCH_CITY,
  birminghamAreaBySlug,
  birminghamPostcode,
  postcodePath,
} from "@/lib/seo/marketing";
import { absoluteUrl } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export async function PostcodeDistrictPage({ prefix }: { prefix: string }) {
  const district = birminghamPostcode(prefix);
  if (!district) notFound();
  const area = birminghamAreaBySlug(district.areaSlug);
  if (!area) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleaners = await loadDirectoryCleaners({
    limit: 8,
    prefix: district.prefix,
  });
  const reviews = reviewsOrFallback(
    await loadDirectoryReviews({ limit: 4, prefix: district.prefix }),
  );
  const path = postcodePath(district.prefix);

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", item: absoluteUrl("/"), name: "Home", position: 1 },
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
            {
              "@type": "ListItem",
              item: absoluteUrl(path),
              name: district.prefix,
              position: 4,
            },
          ],
        }}
      />
      <BrandedPageWash>
        <MarketingHero
          description={`Active Mundoria cleaners whose coverage includes ${district.prefix} in ${area.name}.`}
          eyebrow={`${district.prefix} · ${area.name}`}
          primaryHref={bookingHref}
          primaryLabel="Book a cleaner"
          secondaryHref={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
          secondaryLabel={`All of ${area.name}`}
          title={`Cleaners covering ${district.prefix}`}
        />
        {cleaners?.length ? (
          <LocationFeaturedCleaners cleaners={cleaners} place={district.prefix} />
        ) : (
          <BrandedSection>
            <p className="max-w-2xl text-sm leading-7 text-[#5a5470]">
              Cleaners for {district.prefix} are listed with the rest of {area.name}.{" "}
              <Link
                className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
              >
                View {area.name} cleaners
              </Link>
              .
            </p>
          </BrandedSection>
        )}
        <LocationReviews place={district.prefix} reviews={reviews} />
        <BrandedCtaBand
          body={`Enter a ${district.prefix} postcode and see the estimate before you confirm.`}
          href={bookingHref}
          label="Book in Birmingham"
          title={`Book a cleaner in ${district.prefix}`}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
