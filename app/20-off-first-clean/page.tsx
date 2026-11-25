import type { Metadata } from "next";
import { Suspense } from "react";

import { CallbackOfferPage } from "@/components/marketing/ads/book-2-get-1-free-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { META_OFFER_SOURCE } from "@/lib/bookings/percent-offer";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Get 20% off the total of your first house clean with Mundoria. Request a callback or book online with the same email or phone and the discount is applied automatically.",
  noIndex: true,
  path: "/20-off-first-clean",
  title: "20% Off Your First Clean | Mundoria",
});

export default function TwentyOffFirstCleanRoute() {
  return (
    <MarketingShell>
      <Suspense fallback={null}>
        <CallbackOfferPage
          copy={{
            intro: [
              "Come home to a spotless house, cleaned by vetted, insured local cleaners from £17.50 an hour.",
              "Leave your details below to lock in 20% off your first clean. We'll call to sort everything for you, or book online in minutes and your 20% comes off automatically.",
            ],
            item: META_OFFER_SOURCE,
            source: META_OFFER_SOURCE,
            thanks:
              "Your 20% is locked in. We'll be in touch shortly, or book online now with the same email or phone and the discount comes off automatically.",
            title: "Get 20% off your first clean.",
          }}
        />
      </Suspense>
    </MarketingShell>
  );
}
