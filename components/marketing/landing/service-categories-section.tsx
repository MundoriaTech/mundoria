import Link from "next/link";

import { landingCategoryImages } from "@/components/marketing/landing/constants";
import { LazyImage } from "@/components/shared/lazy-image";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import type { ServiceCategoryDefinition } from "@/lib/customer/services";

/** Landing “Smart Service categories” — three primary entry points. */
const smartMainCategories = [
  "residential",
  "commercial",
  "recovery",
] as const;

/** Card title text as shown on the landing design. */
const smartCategoryLabels: Record<(typeof smartMainCategories)[number], string> =
  {
    commercial: "Commercial Cleaning",
    recovery: "Cleanscape recovery Cleaning",
    residential: "Residential Cleaning",
  };

/** Bottom label bar colours from the landing design. */
const smartCategoryBarColors: Record<(typeof smartMainCategories)[number], string> =
  {
    commercial: "#F5BB95",
    recovery: "#8B40A7",
    residential: "#CF4696",
  };

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
      className="relative z-10 -mt-8 overflow-x-clip px-4 pb-8 pt-0 min-[400px]:px-5 sm:-mt-12 sm:px-8 sm:pb-12 lg:-mt-14"
      id="services"
    >
      <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#F3E6D6] px-4 py-10 min-[400px]:px-5 sm:rounded-[2rem] sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:gap-8">
          <div className="relative z-10 max-w-[516px] shrink-0">
            <div>
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
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 min-[480px]:gap-5 sm:mt-12 sm:gap-6 lg:mt-[72px] lg:mx-auto lg:max-w-[921px] lg:grid-cols-3 lg:gap-6">
          {smartMainCategories.map((value) => (
            <CategoryCard
              barColor={smartCategoryBarColors[value]}
              bookingHref={bookingHref}
              category={getCategory(value)}
              key={value}
              label={smartCategoryLabels[value]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  barColor,
  bookingHref,
  category,
  label,
}: {
  barColor: string;
  bookingHref: string;
  category: ServiceCategoryDefinition;
  label: string;
}) {
  const href =
    bookingHref === "/setup"
      ? "/setup"
      : category.value === "residential"
        ? "/cleaning/residential"
        : category.value === "commercial"
          ? "/cleaning/commercial"
          : category.value === "recovery"
            ? "/cleaning/recovery"
            : `${bookingHref}?category=${category.value}`;

  return (
    <Link
      className="group relative mx-auto block aspect-[295/284] w-full max-w-[22rem] overflow-hidden rounded-tl-[24px] shadow-[0_10px_28px_rgba(28,19,59,0.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(28,19,59,0.18)] min-[480px]:max-w-none sm:rounded-tl-[29px] min-[480px]:[&:last-child]:col-span-2 min-[480px]:[&:last-child]:mx-auto min-[480px]:[&:last-child]:max-w-[calc(50%-0.625rem)] lg:[&:last-child]:col-span-1 lg:[&:last-child]:max-w-none"
      href={href}
    >
      <LazyImage
        alt={label}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
        fill
        sizes="(min-width: 1024px) 295px, (min-width: 480px) 45vw, 92vw"
        src={
          landingCategoryImages[category.value] ??
          landingCategoryImages.residential
        }
      />

      <div
        className="absolute inset-x-0 bottom-0 z-10 flex min-h-0 items-center px-3 py-2 min-[400px]:px-3.5 min-[400px]:py-2.5"
        style={{ backgroundColor: barColor }}
      >
        <p className="text-[13px] font-bold leading-snug text-white min-[400px]:text-[15px] min-[400px]:leading-tight">
          {label}
        </p>
      </div>
    </Link>
  );
}
