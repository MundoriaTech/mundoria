import type { Metadata } from "next";

import { FaqHub } from "@/components/marketing/faq-hub";
import { JsonLd } from "@/components/marketing/json-ld";
import { FAQ_NAV_GROUPS } from "@/lib/seo/site-faq-catalogue";
import { getSiteFaqSections, topSiteFaqs } from "@/lib/seo/site-faqs";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  description:
    "Answers about booking a cleaner with Mundoria: prices, payments, cancellations, cleaner checks and insurance, and every home, moving and workspace service.",
  path: "/faq",
  title: "FAQ: Booking, Prices and Payments | Mundoria",
});

export default async function FaqPage() {
  const sections = await getSiteFaqSections();
  const top = topSiteFaqs(sections);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            // Only the answers visible on this page; each topic page marks up its own.
            mainEntity: top.map((item) => ({
              "@type": "Question",
              acceptedAnswer: { "@type": "Answer", text: item.answer },
              name: item.question,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            hasPart: sections.map((section) => ({
              "@type": "WebPage",
              name: `${section.title} FAQ`,
              url: absoluteUrl(`/faq/${section.id}`),
            })),
            name: "Mundoria FAQ",
            url: absoluteUrl("/faq"),
          },
        ]}
      />

      <FaqHub
        groups={FAQ_NAV_GROUPS}
        sections={sections}
        top={top}
      />
    </>
  );
}
