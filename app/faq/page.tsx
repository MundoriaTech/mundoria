import type { Metadata } from "next";

import { FaqCatalogue } from "@/components/marketing/faq-catalogue";
import { JsonLd } from "@/components/marketing/json-ld";
import { allSiteFaqs } from "@/lib/seo/site-faqs";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria FAQ — booking, home and commercial cleaning, pricing, cleaners, cancellations, recovery and more.",
  path: "/faq",
  title: "FAQ | Mundoria",
});

export default function FaqPage() {
  const faqs = allSiteFaqs();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
            name: item.question,
          })),
        }}
      />

      <FaqCatalogue />
    </>
  );
}
