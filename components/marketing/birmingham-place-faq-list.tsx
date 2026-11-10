import Link from "next/link";

import { MarketingFaqColumnsSection } from "@/components/marketing/marketing-faq-columns-section";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { cleanerPlacePath } from "@/lib/seo/canonical";
import { locationFaqContext, locationFaqs } from "@/lib/seo/location-faqs";
import { LAUNCH_CITY } from "@/lib/seo/marketing";

const linkClass =
  "font-semibold text-[#6a45b8] underline-offset-2 hover:underline";

/** Location FAQ block: six core answers plus the page's local questions. */
export async function BirminghamPlaceFaqList({
  place = "Birmingham",
  placePath,
  title,
}: {
  bookingHref?: string;
  place?: string;
  /** Canonical place URL (no query); identifies the hub, area or town. */
  placePath?: string;
  title?: string;
}) {
  const path = placePath ?? cleanerPlacePath(LAUNCH_CITY.slug);
  const faqs = locationFaqs(
    locationFaqContext(place, path),
    await loadServicePricing(),
  );

  const items = faqs.map((faq) => ({
    question: faq.question,
    answer: (
      <>
        {faq.answer.split("\n\n").map((paragraph, index) => (
          <p className={index ? "mt-2.5" : undefined} key={index}>
            {paragraph}
          </p>
        ))}
        {faq.links?.length ? (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {faq.links.map((link) => (
              <Link className={linkClass} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </p>
        ) : null}
      </>
    ),
  }));

  return (
    <MarketingFaqColumnsSection
      footer={
        <>
          More answers in our{" "}
          <Link className={linkClass} href="/faq">
            FAQ
          </Link>
          ,{" "}
          <Link className={linkClass} href="/help">
            Help Centre
          </Link>
          , and{" "}
          <Link className={linkClass} href="/blog">
            Mundoria Mag
          </Link>
          .
        </>
      }
      items={items}
      title={title ?? `Cleaning in ${place}: your questions`}
    />
  );
}
