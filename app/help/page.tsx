import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { HelpCollectionIcon } from "@/components/marketing/help-collection-icon";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import {
  listHelpArticlesForCollection,
  listHelpCollections,
} from "@/lib/content/editorial";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const HELP_HERO_IMAGE = "/images/mag/welcome-mag.jpg";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Help Centre — advice for customers and cleaners on booking, payments, Recovery, and becoming a partner.",
  path: "/help",
  title: "Help Centre | Mundoria",
});

export const revalidate = 60;

export default async function HelpCentrePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const collections = await listHelpCollections();

  const withArticles = await Promise.all(
    collections.map(async (collection) => ({
      ...collection,
      articles: await listHelpArticlesForCollection(collection.id),
    })),
  );

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-center"
            fill
            priority
            sizes="100vw"
            src={HELP_HERO_IMAGE}
          />
          <CategoryHeroOverlay />
        </div>

        <div className="relative mx-auto flex min-h-[20rem] w-full max-w-[1400px] flex-col justify-end px-4 py-10 sm:min-h-[24rem] sm:px-8 sm:py-12 lg:min-h-[26rem] lg:px-12 lg:py-14">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Help Centre
            </p>
            <h1 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white min-[400px]:text-[2.35rem] sm:text-5xl lg:text-[3.25rem]">
              How can we help?
            </h1>
            <p className="mt-3 max-w-md text-pretty text-[14px] font-normal leading-6 text-white/95 sm:mt-4 sm:text-base sm:leading-7">
              Advice and answers from the Mundoria team — for customers booking
              cleans and cleaners joining the marketplace.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <ContactSupportButton className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-white/90" />
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                href="/blog"
              >
                Mundoria Mag
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BrandedPageWash>
        <BrandedSection>
          {!withArticles.length ? (
            <p className="max-w-xl text-sm leading-7 text-[#5a5470]">
              Help collections will appear here once published.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {withArticles.map((collection) => (
                <Link
                  className="group relative flex min-h-[15rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#e4daf5]/80 bg-[#f7f2ea] p-6 shadow-[0_12px_32px_rgba(49,44,121,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(49,44,121,0.12)]"
                  href={`/help/${collection.slug}`}
                  key={collection.id}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#823fb2]">
                    {collection.audience === "cleaners"
                      ? "For cleaners"
                      : collection.audience === "both"
                        ? "Everyone"
                        : "For customers"}
                  </p>
                  <h2 className="mt-3 max-w-[14rem] text-xl font-semibold tracking-[-0.03em] text-[#1c133b] transition group-hover:text-[#6a45b8]">
                    {collection.title}
                  </h2>
                  <p className="mt-2 max-w-[15rem] flex-1 text-sm leading-6 text-[#5a5470]">
                    {collection.description}
                  </p>
                  <p className="mt-4 text-xs font-medium text-[#5a5470]">
                    {collection.articles.length} article
                    {collection.articles.length === 1 ? "" : "s"}
                  </p>
                  <HelpCollectionIcon slug={collection.slug} />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-[1.5rem] bg-[#efe6ff] px-6 py-7 sm:px-8">
            <h2 className="text-lg font-semibold text-[#1c133b]">
              Still need a hand?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
              Reach the Mundoria team in chat. For an active booking, use in-app
              messaging so the right people see the full context.
            </p>
            <div className="mt-5">
              <ContactSupportButton className="inline-flex h-11 items-center justify-center rounded-full bg-[#6a45b8] px-5 text-sm font-semibold text-white transition hover:bg-[#5a38a3]" />
            </div>
          </div>
        </BrandedSection>

        <BrandedCtaBand
          body="Tell us about your space and get a clear estimate before you confirm."
          href={bookingHref}
          label="Book a clean"
          title="Ready to book?"
        />
      </BrandedPageWash>
    </>
  );
}
