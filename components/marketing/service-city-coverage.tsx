import Link from "next/link";

import { BrandedSection } from "@/components/marketing/branded-page-sections";
import type { MarketingService } from "@/lib/seo/marketing";
import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";

/** Links the main service page to strong area hubs, not service×area copies. */
export function ServiceCityCoverage({ service }: { service: MarketingService }) {
  const label = service.label;
  const featured = BIRMINGHAM_AREAS.slice(0, 8);

  return (
    <BrandedSection>
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        {label} near you
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
        Mundoria is live across {LAUNCH_CITY.name}. Pick your area for local
        coverage, then book {label.toLowerCase()} from this page.
      </p>
      <ul className="mt-5 flex flex-wrap gap-3">
        <li>
          <Link
            className="inline-flex rounded-full border border-[#e4daf5] bg-white px-4 py-2 text-sm font-semibold text-[#1c133b] transition hover:text-[#6a45b8]"
            href={`/cleaners/${LAUNCH_CITY.slug}`}
          >
            Cleaners in {LAUNCH_CITY.name}
          </Link>
        </li>
        {featured.map((area) => (
          <li key={area.slug}>
            <Link
              className="inline-flex rounded-full border border-[#e4daf5] bg-white px-4 py-2 text-sm font-semibold text-[#1c133b] transition hover:text-[#6a45b8]"
              href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
            >
              {area.name}
            </Link>
          </li>
        ))}
      </ul>
    </BrandedSection>
  );
}
