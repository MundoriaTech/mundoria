import Link from "next/link";

import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import { Stagger, StaggerItem } from "@/components/shared/motion-primitives";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { directionFor } from "@/lib/motion";
import { LAUNCH_CITY_COVERAGE_GROUPS } from "@/lib/seo/launch-city-coverage-links";
import { LAUNCH_CITY } from "@/lib/seo/marketing";

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
          Mundoria services in our top cities
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-[14px] font-normal leading-[1.55] text-white/90">
          Now serving {LAUNCH_CITY.name} neighbourhood by neighbourhood. More
          UK cities coming soon.
        </p>

        <Stagger
          className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          gap={0.1}
          inView
        >
          {LAUNCH_CITY_COVERAGE_GROUPS.map((group, index) => (
            <StaggerItem
              className="min-w-0"
              distance={28}
              from={directionFor(index, 3)}
              key={group.id}
            >
              <h3 className="text-[15px] font-semibold leading-snug text-white">
                {group.heading}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-[15px] marker:text-white/70">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="break-words text-[13px] font-normal leading-[1.45] text-white/90 transition hover:text-[#c79c66]"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </ScrollReveal>
  );
}
