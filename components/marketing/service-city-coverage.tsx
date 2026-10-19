import Link from "next/link";

import { BrandedSection } from "@/components/marketing/branded-page-sections";
import type { MarketingService } from "@/lib/seo/marketing";
import { LAUNCH_CITY, servicePlacePath } from "@/lib/seo/marketing";

/** Local SEO block for subcategory pages — e.g. Regular cleaning in Birmingham. */
export function ServiceCityCoverage({ service }: { service: MarketingService }) {
  const cityHref = servicePlacePath(service.slug);
  const label = service.label;

  return (
    <BrandedSection>
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
        {label} in your city
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
        Mundoria is live in {LAUNCH_CITY.name}. Open the local page for coverage
        and a clear estimate before you book.
      </p>
      <ul className="mt-5 flex flex-wrap gap-3">
        <li>
          <Link
            className="inline-flex rounded-full border border-[#e4daf5] bg-white px-4 py-2 text-sm font-semibold text-[#1c133b] transition hover:text-[#6a45b8]"
            href={cityHref}
          >
            {label} in {LAUNCH_CITY.name}
          </Link>
        </li>
      </ul>
    </BrandedSection>
  );
}
