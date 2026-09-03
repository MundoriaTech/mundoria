import Link from "next/link";

import { landingCategoryBadges, landingCategoryImages } from "@/components/marketing/landing/constants";
import { LazyImage } from "@/components/shared/lazy-image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import type { ServiceCategoryDefinition } from "@/lib/customer/services";

const topRowCategories = ["residential", "commercial", "short_term_rental"] as const;
const bottomRowCategories = ["exterior", "recovery"] as const;

function getCategory(value: string) {
  return SERVICE_CATEGORIES.find((category) => category.value === value)!;
}

export function ServiceCategoriesSection({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <ScrollReveal
      as="section"
      className="bg-[#f4ebfe] px-5 py-20 sm:px-8 sm:py-24"
      id="services"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4 lg:gap-5">
          <div className="max-w-[516px] shrink-0">
            <p className="text-[12px] font-normal uppercase tracking-[0.43em] text-black">
              Smart Service categories
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[#1c133b] sm:text-[2.5rem] lg:text-[40px] lg:leading-[41px]">
              Every cleaning need, clearly organised.
            </h2>
            <p className="mt-4 max-w-[376px] text-[13px] font-light leading-[17px] text-black">
              Choose a category to start. CleanScape guides you to the right
              service, cleaning standard and optional add-ons.
            </p>
          </div>

          <div
            aria-hidden
            className="pointer-events-none -mt-4 flex shrink-0 items-center sm:-mt-8 lg:-mt-10"
          >
            <LazyImage
              alt=""
              className="h-auto w-[130px] sm:w-[180px] lg:w-[214px]"
              height={223}
              src="/images/marketing/landing/Brush.png"
              width={214}
            />
            <LazyImage
              alt=""
              className="h-auto w-[97px] shrink-0 -ml-[53px] sm:w-[134px] sm:-ml-[73px] lg:w-[159px] lg:-ml-[88px]"
              height={156}
              src="/images/marketing/landing/Sparkles.png"
              width={159}
            />
          </div>
        </div>

        <div className="mt-14 lg:mt-[72px]">
          <div className="mx-auto grid max-w-[921px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topRowCategories.map((value, index) => (
              <ScrollReveal delay={index * 50} key={value}>
                <CategoryCard
                  bookingHref={bookingHref}
                  category={getCategory(value)}
                />
              </ScrollReveal>
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-[614px] grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-7">
            {bottomRowCategories.map((value, index) => (
              <ScrollReveal delay={(index + 3) * 50} key={value}>
                <CategoryCard
                  bookingHref={bookingHref}
                  category={getCategory(value)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </ScrollReveal>
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
      : `${bookingHref}?category=${category.value}`;

  const badge =
    landingCategoryBadges[category.value] ?? "Explore";

  return (
    <Link
      className="group relative mx-auto block aspect-[295/284] w-full overflow-hidden rounded-tl-[29px] shadow-[0_10px_28px_rgba(28,19,59,0.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(28,19,59,0.18)]"
      href={href}
    >
      <LazyImage
        alt={category.label}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
        fill
        sizes="(min-width: 1024px) 295px, (min-width: 640px) 50vw, 100vw"
        src={
          landingCategoryImages[category.value] ??
          landingCategoryImages.residential
        }
      />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#1b1432]/70 to-transparent" />

      <div className="absolute right-1 top-0 z-10 flex w-[58px] flex-col items-center">
        <LazyImage
          alt=""
          aria-hidden
          className="h-[92px] w-[58px] object-contain"
          height={92}
          src="/images/marketing/landing/badge-ribbon.png"
          width={58}
        />
        <div className="absolute inset-x-0 top-3 flex flex-col items-center px-1 text-center">
          <span className="text-[11px] leading-none text-[#c79c66]">★</span>
          <span className="mt-1 whitespace-pre-line text-[10px] font-semibold leading-[1.15] text-white">
            {badge}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-3 z-10 rounded-[7px] bg-white px-3 py-2">
        <p className="text-[15px] font-bold leading-none text-[#7146ba]">
          {category.label}
        </p>
      </div>
    </Link>
  );
}
