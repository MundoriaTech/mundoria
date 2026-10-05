import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  loadDirectoryCleaner,
  loadDirectoryReviews,
} from "@/lib/seo/birmingham-directory";
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
  const reviews = await loadDirectoryReviews({
    cleanerId: cleaner.id,
    limit: 6,
  });

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const areaHref = `/cleaners/${LAUNCH_CITY.slug}/${area.slug}`;
  const initials = cleaner.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const facts = [
    {
      label: "Rating",
      value: cleaner.rating > 0 ? cleaner.rating.toFixed(1) : "New",
    },
    { label: "Reviews", value: String(cleaner.reviewCount) },
    { label: "Jobs", value: String(cleaner.jobs) },
    { label: "Covers", value: cleaner.areas },
  ];

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
              item: absoluteUrl(areaHref),
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
      <BrandedPageWash underNav>
        <section
          className="px-4 pb-16 sm:px-8 sm:pb-20"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 1.5rem)` }}
        >
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Breadcrumb" className="text-sm text-[#5a5470]">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link className="hover:text-[#1c133b]" href="/">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    className="hover:text-[#1c133b]"
                    href={`/cleaners/${LAUNCH_CITY.slug}`}
                  >
                    Birmingham
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link className="hover:text-[#1c133b]" href={areaHref}>
                    {area.name}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="font-medium text-[#1c133b]">{cleaner.name}</li>
              </ol>
            </nav>

            <article className="mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_18px_50px_rgba(28,19,59,0.08)]">
              <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start lg:gap-10">
                {cleaner.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-36 w-36 shrink-0 rounded-full object-cover object-top ring-4 ring-[#fff4ee] sm:h-44 sm:w-44"
                    src={cleaner.avatarUrl}
                  />
                ) : (
                  <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-[#efe6ff] text-3xl font-semibold text-[#6a45b8] ring-4 ring-[#fff4ee] sm:h-44 sm:w-44">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4694a]">
                    Independent cleaner · {area.name}
                  </p>
                  <h1 className="mt-2 text-[2.4rem] font-semibold leading-none tracking-[-0.045em] text-[#1c133b] sm:text-5xl">
                    {cleaner.name}
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#5a5470]">
                    {cleaner.bio}
                  </p>

                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {facts.map((fact) => (
                      <div
                        className="rounded-2xl bg-[#f3f4f6] px-4 py-3"
                        key={fact.label}
                      >
                        <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8b8798]">
                          {fact.label}
                        </dt>
                        <dd className="mt-1 truncate text-lg font-semibold tracking-tight text-[#1c133b]">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {cleaner.services.length ? (
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {cleaner.services.map((service) => (
                        <li
                          className="rounded-full bg-[#fff4ee] px-3 py-1.5 text-sm font-medium text-[#7a3b28]"
                          key={service}
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#312c79]"
                      href={bookingHref}
                    >
                      Book a clean
                    </Link>
                    <Link
                      className="inline-flex h-12 items-center justify-center rounded-full border border-[#e5e7eb] px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f3f4f6]"
                      href={areaHref}
                    >
                      More cleaners in {area.name}
                    </Link>
                  </div>
                  <p className="mt-3 max-w-md text-xs leading-5 text-[#8b8798]">
                    Booking matches a cleaner who covers your postcode.
                  </p>
                </div>
              </div>
            </article>

            {reviews?.length ? (
              <section className="mt-10">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1c133b]">
                  Reviews for {cleaner.name}
                </h2>
                <ul className="mt-5 divide-y divide-[#e5e7eb] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_12px_32px_rgba(28,19,59,0.05)]">
                  {reviews.map((review) => (
                    <li
                      className="flex gap-4 px-5 py-5 sm:gap-6 sm:px-7"
                      key={`${review.author}-${review.service}-${review.body.slice(0, 24)}`}
                    >
                      <p className="w-12 shrink-0 pt-0.5 text-lg font-semibold tracking-tight text-[#1c133b]">
                        {review.score != null ? review.score.toFixed(1) : "—"}
                      </p>
                      <div className="min-w-0">
                        <p className="text-sm leading-7 text-[#3d3a48]">
                          “{review.body}”
                        </p>
                        <p className="mt-2 text-sm text-[#5a5470]">
                          <span className="font-semibold text-[#1c133b]">
                            {review.author}
                          </span>
                          {review.when ? ` · ${review.when}` : ""}
                          <span className="mt-0.5 block text-xs font-medium text-[#d4694a]">
                            {review.service}
                          </span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </section>
      </BrandedPageWash>
    </MarketingShell>
  );
}
