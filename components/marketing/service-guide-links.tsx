import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandedSection } from "@/components/marketing/branded-page-sections";
import type { MarketingService } from "@/lib/seo/marketing";
import {
  SERVICE_GUIDE_TOPICS,
  serviceGuide,
  serviceGuidePath,
  type ServiceGuideTopic,
} from "@/lib/seo/service-guides";

/**
 * Plain internal links to a service's price, "what's included" and booking
 * guides. The guides used to be linked only from the retired service×area
 * pages, which left them reachable from the sitemap alone.
 */
export function ServiceGuideLinks({
  current,
  service,
}: {
  /** Guide being viewed, left out of the list. */
  current?: ServiceGuideTopic;
  service: MarketingService;
}) {
  const topics = SERVICE_GUIDE_TOPICS.filter((topic) => topic !== current);
  if (!topics.length) return null;

  return (
    <BrandedSection tone="cream">
      <h2 className="max-w-xl text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        {current
          ? `More about ${service.label.toLowerCase()}`
          : `${service.label} questions, answered`}
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {topics.map((topic) => {
          const guide = serviceGuide(service, topic);
          return (
            <li key={topic}>
              <Link
                className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-[15px] font-semibold leading-snug text-[#1c133b] transition hover:border-[#6a45b8]"
                href={serviceGuidePath(service.slug, topic)}
              >
                <span>{guide.title}</span>
                <ArrowRight
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#6a45b8] transition group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </BrandedSection>
  );
}
