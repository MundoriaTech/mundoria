import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingFaqColumnsSection } from "@/components/marketing/marketing-faq-columns-section";
import {
  PlaceServiceExplainerIntro,
  PlaceServiceExplainerList,
} from "@/components/marketing/place-service-explainer-list";
import {
  BIRMINGHAM_SERVICE_FAQ_LINKS,
  birminghamPlaceFaqEntries,
  bookCleanerSteps,
  houseCleanCoveredPoints,
  whyChooseMundoriaPoints,
} from "@/lib/seo/birmingham-place-faqs";
import { LAUNCH_CITY } from "@/lib/seo/marketing";

const linkClass =
  "font-semibold text-[#6a45b8] underline-offset-2 hover:underline";

export function BirminghamPlaceFaqList({
  bookingHref,
  place = "Birmingham",
  title,
}: {
  bookingHref: string;
  place?: string;
  title?: string;
}) {
  const { deep } = BIRMINGHAM_SERVICE_FAQ_LINKS;
  const entries = birminghamPlaceFaqEntries(place);

  const richAnswers: Record<string, ReactNode> = {
    [entries[0]!.question]: (
      <>
        <PlaceServiceExplainerIntro place={place} />
        <PlaceServiceExplainerList place={place} />
      </>
    ),
    [entries[1]!.question]: (
      <>
        <p>
          Exact scope depends on your service and cleaning standard. Typical
          residential visits include:
        </p>
        <ul className="mt-2.5 list-disc space-y-1.5 pl-5">
          {houseCleanCoveredPoints().map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </>
    ),
    [entries[2]!.question]: (
      <ol className="list-decimal space-y-1.5 pl-5">
        {bookCleanerSteps(place).map((step, index) => (
          <li key={step}>
            {index === 0 ? (
              <>
                Open{" "}
                <Link className={linkClass} href={bookingHref}>
                  Mundoria booking
                </Link>{" "}
                and enter your postcode in {place}
              </>
            ) : (
              step
            )}
          </li>
        ))}
      </ol>
    ),
    [entries[3]!.question]: (
      <>
        <ol className="list-decimal space-y-1.5 pl-5">
          {whyChooseMundoriaPoints().map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
        <p className="mt-3">
          Ready to try Mundoria?{" "}
          <Link className={linkClass} href={`/cleaners/${LAUNCH_CITY.slug}`}>
            See cleaners in {place}
          </Link>
          .
        </p>
      </>
    ),
    [entries[8]!.question]: (
      <>
        Yes. Choose deep cleaning when you{" "}
        <Link className={linkClass} href={bookingHref}>
          book online
        </Link>{" "}
        or read more about{" "}
        <Link className={linkClass} href={deep}>
          deep cleaning in {place}
        </Link>
        . Add oven, fridge or interior windows if you want a heavier reset.
      </>
    ),
    [entries[9]!.question]: (
      <>
        Use your own products and equipment, or add{" "}
        <Link className={linkClass} href={`${bookingHref}?step=addons`}>
          cleaning products
        </Link>{" "}
        and cleaning equipment in booking. Share fragrance-free or allergy notes
        in the booking instructions.
      </>
    ),
    [entries[10]!.question]: (
      <>
        Cancel or reschedule free of charge more than 48 hours before the visit.
        A partial fee may apply within 48 hours, and the full amount within 24
        hours. See the{" "}
        <Link className={linkClass} href="/help">
          Help Centre
        </Link>{" "}
        and your booking confirmation for the exact windows.
      </>
    ),
  };

  const items = entries.map((item) => ({
    answer: richAnswers[item.question] ?? item.schemaAnswer,
    question: item.question,
  }));

  return (
    <MarketingFaqColumnsSection
      footer={
        <>
          More answers in our{" "}
          <Link className={linkClass} href="/help">
            Help Centre
          </Link>{" "}
          and{" "}
          <Link className={linkClass} href="/blog">
            Mundoria Mag
          </Link>
          .
        </>
      }
      items={items}
      title={title ?? "Mundoria FAQ"}
    />
  );
}
