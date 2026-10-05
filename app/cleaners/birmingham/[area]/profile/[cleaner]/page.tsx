import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { loadDirectoryCleaner } from "@/lib/seo/birmingham-directory";
import { LAUNCH_CITY, birminghamAreaBySlug } from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { area: string; cleaner: string };
};

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const area = birminghamAreaBySlug(params.area);
  const shortId = params.cleaner.split("-").at(-1) ?? "";
  if (!area || shortId.length < 8) return {};
  const cleaner = await loadDirectoryCleaner(shortId, area.slug);
  if (!cleaner) return {};
  return buildPageMetadata({
    description: cleaner.bio,
    path: cleaner.href,
    title: `${cleaner.name}, cleaner in ${area.name}`,
  });
}

export default async function BirminghamCleanerPage({ params }: PageProps) {
  const area = birminghamAreaBySlug(params.area);
  if (!area) notFound();
  const shortId = params.cleaner.split("-").at(-1) ?? "";
  if (shortId.length < 8) notFound();

  const cleaner = await loadDirectoryCleaner(shortId, area.slug);
  if (!cleaner) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

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
              item: absoluteUrl(cleaner.href),
              name: cleaner.name,
              position: 4,
            },
          ],
        }}
      />
      <BrandedPageWash>
        <MarketingHero
          description={cleaner.bio}
          eyebrow={`${area.name} · Birmingham`}
          primaryHref={bookingHref}
          primaryLabel="Book this area"
          secondaryHref={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
          secondaryLabel={`More cleaners in ${area.name}`}
          title={cleaner.name}
        />
        <BrandedSection>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {cleaner.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-24 w-24 rounded-full object-cover object-top"
                src={cleaner.avatarUrl}
              />
            ) : null}
            <dl className="grid flex-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[#c79c66]">
                  Rating
                </dt>
                <dd className="mt-1 text-lg font-semibold text-[#1c133b]">
                  {cleaner.rating > 0 ? `${cleaner.rating.toFixed(1)} / 5` : "New"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[#c79c66]">
                  Jobs
                </dt>
                <dd className="mt-1 text-lg font-semibold text-[#1c133b]">
                  {cleaner.jobs}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[#c79c66]">
                  Covers
                </dt>
                <dd className="mt-1 text-lg font-semibold text-[#1c133b]">
                  {cleaner.areas}
                </dd>
              </div>
            </dl>
          </div>
          {cleaner.services.length ? (
            <p className="mt-6 text-sm leading-7 text-[#5a5470]">
              Services: {cleaner.services.join(", ")}.
            </p>
          ) : null}
          <p className="mt-4 text-sm text-[#5a5470]">
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
            >
              All cleaners in {area.name}
            </Link>
          </p>
        </BrandedSection>
        <BrandedCtaBand
          body="Choose a service and time. Mundoria matches a cleaner who covers your postcode."
          href={bookingHref}
          label="Start a booking"
          title={`Book a clean in ${area.name}`}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
