import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Star } from "lucide-react";

import { JsonLd } from "@/components/marketing/json-ld";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { FeaturedCleanerCards } from "@/components/marketing/featured-cleaner-cards";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { LocationStickyBookBar } from "@/components/marketing/location-sticky-book-bar";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  bookingHrefWithDirectoryCleaner,
  loadDirectoryCleaner,
  loadDirectoryCleaners,
  loadDirectoryReviews,
  type DirectoryCleaner,
} from "@/lib/seo/birmingham-directory";
import { LAUNCH_CITY, birminghamAreaBySlug } from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

function RatingStars({ score }: { score: number | null }) {
  const value = score ?? 0;
  return (
    <span
      aria-label={score == null ? "No rating" : `${score.toFixed(1)} out of 5`}
      className="inline-flex gap-0.5 text-[#c79c66]"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden
          className={cn(
            "size-3.5",
            index < Math.round(value) ? "fill-current" : "fill-none",
          )}
          key={index}
          strokeWidth={1.75}
        />
      ))}
    </span>
  );
}

async function otherPros(cleaner: DirectoryCleaner, areaSlug: string) {
  const nearby = await loadDirectoryCleaners({ areaSlug, limit: 8 });
  const picked = (nearby ?? []).filter((item) => item.id !== cleaner.id);
  if (picked.length >= 3) return picked.slice(0, 3);

  const wider = await loadDirectoryCleaners({ limit: 12 });
  const seen = new Set([cleaner.id, ...picked.map((item) => item.id)]);
  for (const item of wider ?? []) {
    if (seen.has(item.id)) continue;
    picked.push(item);
    if (picked.length === 3) break;
  }
  return picked.slice(0, 3);
}

type PageProps = {
  params: { area: string; cleaner: string };
};

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const area = birminghamAreaBySlug(params.area);
  if (!area) return {};
  const cleaner = await loadDirectoryCleaner(params.cleaner, area.slug);
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

  const cleaner = await loadDirectoryCleaner(params.cleaner, area.slug);
  if (!cleaner) notFound();
  const canonicalSlug = cleaner.href.split("/").at(-1);
  if (canonicalSlug && canonicalSlug !== params.cleaner) {
    permanentRedirect(cleaner.href);
  }
  const [reviews, pros] = await Promise.all([
    loadDirectoryReviews({
      cleanerId: cleaner.id,
      limit: 6,
    }),
    otherPros(cleaner, area.slug),
  ]);

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const bookWithHref = bookingHrefWithDirectoryCleaner(bookingHref, cleaner);
  const areaHref = `/cleaners/${LAUNCH_CITY.slug}/${area.slug}`;
  const initials = cleaner.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const ratingLabel = cleaner.rating > 0 ? cleaner.rating.toFixed(1) : "New";
  const reviewLabel = `${cleaner.reviewCount} review${cleaner.reviewCount === 1 ? "" : "s"}`;

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

            <article className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(28,19,59,0.08)]">
              <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-start lg:gap-10">
                {cleaner.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-28 w-28 shrink-0 rounded-full object-cover object-top sm:h-36 sm:w-36"
                    src={cleaner.avatarUrl}
                  />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-3xl font-semibold text-[#1c133b] sm:h-36 sm:w-36">
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
                  <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#5a5470]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#1c133b]">
                      <Star
                        aria-hidden
                        className="size-4 fill-[#c79c66] text-[#c79c66]"
                      />
                      {ratingLabel}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{reviewLabel}</span>
                    <span aria-hidden>·</span>
                    <span>{cleaner.jobs} jobs</span>
                    <span aria-hidden>·</span>
                    <span>Covers {cleaner.areas}</span>
                  </p>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#5a5470]">
                    {cleaner.bio}
                  </p>
                  <Link
                    className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#312c79]"
                    href={bookWithHref}
                  >
                    Book with {cleaner.name}
                  </Link>
                </div>
              </div>

              {cleaner.services.length ? (
                <div className="border-t border-[#efeaf8] px-6 py-6 sm:px-10">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8798]">
                    Services
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {cleaner.services.map((service) => (
                      <li
                        className="rounded-full border border-[#e4daf5] bg-[#faf8ff] px-3 py-1.5 text-sm font-medium text-[#1c133b]"
                        key={service}
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>

            {reviews?.length ? (
              <section className="mt-14">
                <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                  Reviews for {cleaner.name}
                </h2>
                <ul className="mt-6 grid gap-4">
                  {reviews.map((review) => (
                    <li
                      className="rounded-[1.5rem] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(28,19,59,0.05)] sm:px-7"
                      key={`${review.author}-${review.service}-${review.body.slice(0, 24)}`}
                    >
                      <RatingStars score={review.score} />
                      <p className="mt-3 text-base leading-7 text-[#3d3a48]">
                        “{review.body}”
                      </p>
                      <p className="mt-4 text-sm text-[#5a5470]">
                        <span className="font-semibold text-[#1c133b]">
                          {review.author}
                        </span>
                        {review.when ? ` · ${review.when}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#d4694a]">
                        {review.service}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {pros.length ? (
              <section className="mt-16">
                <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                  Discover other pros
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
                  Other independent cleaners covering {area.name}.
                </p>
                <FeaturedCleanerCards bookingHref={bookingHref} cleaners={pros} />
              </section>
            ) : null}
          </div>
        </section>

        <LocationStickyBookBar
          bookingHref={bookWithHref}
          label={`Book with ${cleaner.name}`}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
