import type { Metadata } from "next";
import { Suspense } from "react";

import { Book2Get1FreePage } from "@/components/marketing/ads/book-2-get-1-free-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Book 2 hours of Mundoria house cleaning at £17.50 per hour and get 1 hour free. Leave your details for a callback, or continue booking online.",
  noIndex: true,
  path: "/book-2-get-1-free",
  title: "Book 2 Hours, Get 1 Free | Mundoria",
});

export default function Book2Get1FreeRoute() {
  return (
    <MarketingShell>
      <Suspense fallback={null}>
        <Book2Get1FreePage />
      </Suspense>
    </MarketingShell>
  );
}
