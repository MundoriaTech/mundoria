import Link from "next/link";

import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";

export function CoverageSection() {
  return (
    <ScrollReveal
      as="section"
      className="overflow-x-clip bg-white px-4 py-14 sm:px-8 sm:py-20"
      id="coverage"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-md text-balance text-[1.75rem] font-medium leading-tight text-[#1c133b] sm:text-[32px] sm:leading-[35px]">
          CleanScape services in our top cities
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-[14px] font-normal leading-[1.55] text-black">
          Now serving {LAUNCH_CITY.name} neighbourhood by neighbourhood. More
          UK cities coming soon.
        </p>

        <div className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {SERVICE_CATEGORIES.map((category) => (
            <div className="min-w-0" key={category.value}>
              <h3 className="text-[15px] font-semibold leading-snug text-black">
                {category.label.replace(" Cleaning", "")}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-[15px]">
                {BIRMINGHAM_AREAS.map((area) => (
                  <li key={`${category.value}-${area.slug}`}>
                    <Link
                      className="break-words text-[13px] font-normal leading-[1.45] text-black transition hover:text-[#312c79]"
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
