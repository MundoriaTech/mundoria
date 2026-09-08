import Link from "next/link";

import {
  landingCategoryBadges,
  landingCategoryImages,
} from "@/components/marketing/landing/constants";
import { LazyImage } from "@/components/shared/lazy-image";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import type { ServiceCategoryDefinition } from "@/lib/customer/services";

const topRowCategories = [
  "residential",
  "commercial",
  "short_term_rental",
] as const;
const bottomRowCategories = ["exterior", "recovery"] as const;
const allCategories = [...topRowCategories, ...bottomRowCategories] as const;

function getCategory(value: string) {
  return SERVICE_CATEGORIES.find((category) => category.value === value)!;
}

export function ServiceCategoriesSection({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <section
      className="overflow-x-clip bg-[#f4ebfe] px-4 pb-14 pt-6 min-[400px]:px-5 sm:px-8 sm:pb-24 sm:pt-8"
      id="services"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:gap-8">
          <div className="relative z-10 max-w-[516px] shrink-0">
            {/* Reserve space for the corner accent on phones only */}
            <div className="pr-[7.25rem] min-[400px]:pr-[8.5rem] sm:pr-0">
              <p className="text-[11px] font-normal uppercase tracking-[0.24em] text-black min-[400px]:text-[12px] sm:tracking-[0.43em]">
                Smart Service categories
              </p>
              <h2 className="mt-3 text-balance text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1c133b] min-[400px]:text-[1.85rem] sm:text-[2.5rem] lg:text-[40px] lg:leading-[41px]">
                Every cleaning need, clearly organised.
              </h2>
            </div>
            <p className="mt-3 max-w-[376px] text-pretty text-[13px] font-light leading-5 text-black sm:mt-4 sm:leading-[17px]">
              Choose a category to start. CleanScape guides you to the right
              service, cleaning standard and optional add-ons.
            </p>
          </div>

          {/*
            Phone: scaled corner accent (top-right of the title block).
            sm+: inline decorative pair beside the copy.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-0.5 top-0 z-0 flex items-start sm:static sm:-mt-8 sm:shrink-0 sm:self-start sm:items-center lg:-mt-10"
          >
            <LazyImage
              alt=""
              className="h-auto w-[88px] min-[400px]:w-[104px] sm:w-[180px] lg:w-[214px]"
              height={223}
              src="/images/marketing/landing/Brush.png"
              width={214}
            />
            <LazyImage
              alt=""
              className="h-auto w-[64px] shrink-0 -ml-[34px] -mt-1 min-[400px]:w-[78px] min-[400px]:-ml-[42px] sm:mt-0 sm:w-[134px] sm:-ml-[73px] lg:w-[159px] lg:-ml-[88px]"
              height={156}
              src="/images/marketing/landing/Sparkles.png"
              width={159}
            />
          </div>
        </div>

        {/* Phone + tablet: one even 1/2-col grid (avoids orphan third card) */}
        <div className="mt-10 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 min-[480px]:gap-5 sm:mt-12 sm:gap-6 lg:hidden">
          {allCategories.map((value) => (
            <CategoryCard
              bookingHref={bookingHref}
              category={getCategory(value)}
              key={value}
            />
          ))}
        </div>

        {/* Desktop: designed 3-up + centred 2-up */}
        <div className="mt-[72px] hidden lg:block">
          <div className="mx-auto grid max-w-[921px] grid-cols-3 gap-6">
            {topRowCategories.map((value) => (
              <CategoryCard
                bookingHref={bookingHref}
                category={getCategory(value)}
                key={value}
              />
            ))}
          </div>

          <div className="mx-auto mt-7 grid max-w-[614px] grid-cols-2 gap-6">
            {bottomRowCategories.map((value) => (
              <CategoryCard
                bookingHref={bookingHref}
                category={getCategory(value)}
                key={value}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  bookingHref,
  category,
}: {
  bookingHref: string;
  category: ServiceCategoryDefinition;
}) {
  const href =
    bookingHref === "/setup"
      ? "/setup"
      : category.value === "residential"
        ? "/cleaning/residential"
        : `${bookingHref}?category=${category.value}`;

  const badge = landingCategoryBadges[category.value] ?? "Explore";

  return (
    <Link
      className="group relative mx-auto block aspect-[295/284] w-full max-w-[22rem] overflow-hidden rounded-tl-[24px] shadow-[0_10px_28px_rgba(28,19,59,0.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(28,19,59,0.18)] min-[480px]:max-w-none sm:rounded-tl-[29px]"
      href={href}
    >
      <LazyImage
        alt={category.label}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
        fill
        sizes="(min-width: 1024px) 295px, (min-width: 480px) 45vw, 92vw"
        src={
          landingCategoryImages[category.value] ??
          landingCategoryImages.residential
        }
      />

      <div className="absolute right-0.5 top-0 z-10 flex w-[48px] flex-col items-center min-[400px]:right-1 min-[400px]:w-[58px]">
        <LazyImage
          alt=""
          aria-hidden
          className="h-[76px] w-[48px] object-contain min-[400px]:h-[92px] min-[400px]:w-[58px]"
          height={92}
          src="/images/marketing/landing/badge-ribbon.png"
          width={58}
        />
        <div className="absolute inset-x-0 top-2.5 flex flex-col items-center px-0.5 text-center min-[400px]:top-3 min-[400px]:px-1">
          <span className="text-[10px] leading-none text-[#c79c66] min-[400px]:text-[11px]">
            ★
          </span>
          <span className="mt-0.5 whitespace-pre-line text-[9px] font-semibold leading-[1.15] text-white min-[400px]:mt-1 min-[400px]:text-[10px]">
            {badge}
          </span>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-10 flex min-h-0 items-center px-3 py-2 min-[400px]:px-3.5 min-[400px]:py-2.5"
        style={{
          backgroundImage:
            "linear-gradient(118deg, #8b6ad4 0%, #6a45b8 42%, #3f2a7a 100%)",
        }}
      >
        <p className="text-[13px] font-bold leading-snug text-white min-[400px]:text-[15px] min-[400px]:leading-tight">
          {category.label}
        </p>
      </div>
    </Link>
  );
}
