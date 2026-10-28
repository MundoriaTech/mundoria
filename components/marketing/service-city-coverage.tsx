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
      <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-brand-ink sm:text-2xl lg:text-[1.75rem]">
        {label} in your city
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
        Mundoria is live in {LAUNCH_CITY.name}. Open the local page for coverage
        and a clear estimate before you book.
      </p>
      <ul className="mt-5 flex flex-wrap gap-3">
        <li>
          <Link
            className="inline-flex rounded-full border border-brand-lavender bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:text-brand-purple"
            href={cityHref}
          >
            {label} in {LAUNCH_CITY.name}
          </Link>
        </li>
      </ul>
    </BrandedSection>
  );
}
