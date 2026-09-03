import Link from "next/link";

import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";

export function CoverageSection() {
  return (
    <ScrollReveal
      as="section"
      className="bg-white px-5 py-20 sm:px-8"
      id="coverage"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-md text-[32px] font-medium leading-[35px] text-[#1c133b]">
          CleanScape services in our top cities
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] font-normal leading-[1.55] text-black">
          Now serving {LAUNCH_CITY.name} neighbourhood by neighbourhood. More
          UK cities coming soon.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICE_CATEGORIES.map((category) => (
            <div key={category.value}>
              <h3 className="text-[15px] font-semibold leading-snug text-black">
                {category.label.replace(" Cleaning", "")}
              </h3>
              <ul className="mt-3 list-disc space-y-1 pl-[15px]">
                {BIRMINGHAM_AREAS.map((area) => (
                  <li key={`${category.value}-${area.slug}`}>
                    <Link
                      className="text-[13px] font-normal leading-[1.55] text-black transition hover:text-[#312c79]"
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
