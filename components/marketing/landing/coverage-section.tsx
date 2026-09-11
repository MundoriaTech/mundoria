import Link from "next/link";

import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";

export function CoverageSection() {
  return (
    <ScrollReveal
      as="section"
      className="overflow-x-clip px-4 py-14 sm:px-8 sm:py-20"
      id="coverage"
      style={{ backgroundColor: LANDING_PURPLE }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-md text-balance text-[1.75rem] font-medium leading-tight text-white sm:text-[32px] sm:leading-[35px]">
          CleanScape services in our top cities
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-[14px] font-normal leading-[1.55] text-white/90">
          Now serving {LAUNCH_CITY.name} neighbourhood by neighbourhood. More
          UK cities coming soon.
        </p>

        <div className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {SERVICE_CATEGORIES.filter((category) =>
            ["residential", "commercial", "recovery"].includes(category.value),
          ).map((category) => (
            <div className="min-w-0" key={category.value}>
              <h3 className="text-[15px] font-semibold leading-snug text-white">
                {category.label.replace(" Cleaning", "")}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-[15px] marker:text-white/70">
                {BIRMINGHAM_AREAS.map((area) => (
                  <li key={`${category.value}-${area.slug}`}>
                    <Link
                      className="break-words text-[13px] font-normal leading-[1.45] text-white/90 transition hover:text-[#c79c66]"
                      href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
                    >
                      {category.label} in {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
