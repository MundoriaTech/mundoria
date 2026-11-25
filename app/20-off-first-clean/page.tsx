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
              "House cleaning from £17.50 an hour, with vetted, insured cleaners.",
              "Get 20% off the total of your first clean. Leave your details below to claim it, then book online with the same email or phone (or we'll book it for you) and the 20% comes off automatically. No code needed.",
            ],
            item: META_OFFER_SOURCE,
            source: META_OFFER_SOURCE,
            thanks:
              "Book your first clean online with this email or phone and 20% comes off the total at checkout — no promo code.",
            title: "Get 20% off your first clean.",
          }}
        />
      </Suspense>
    </MarketingShell>
  );
}
