import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqSectionView } from "@/components/marketing/faq-section-view";
import { JsonLd } from "@/components/marketing/json-ld";
import { faqSectionPath } from "@/lib/seo/faq-paths";
import { FAQ_NAV_GROUPS } from "@/lib/seo/site-faq-catalogue";
import {
  SITE_FAQ_SECTIONS,
  getSiteFaqSection,
} from "@/lib/seo/site-faqs";
import {
  MAX_TITLE_LENGTH,
  absoluteUrl,
  buildPageMetadata,
  fullDescription,
} from "@/lib/seo/site";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;
export const dynamicParams = false;

type PageProps = { params: { section: string } };

export function generateStaticParams() {
  return SITE_FAQ_SECTIONS.map((section) => ({ section: section.id }));
}

function sectionTitle(title: string) {
  const full = `${title} FAQ | Mundoria`;
  return full.length <= MAX_TITLE_LENGTH ? full : `${title} FAQ`;
}

/** Keep meta descriptions under 160 characters, cut at a word boundary. */
function clampDescription(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "")}…`;
}

export function generateMetadata({ params }: PageProps): Metadata {
  const section = SITE_FAQ_SECTIONS.find((item) => item.id === params.section);
  if (!section) return {};
  const questions = section.items
    .slice(0, 3)
    .map((item) => item.question)
    .join(" ");
  return buildPageMetadata({
    description: clampDescription(
      fullDescription(`${section.title}: ${section.description}`, questions),
    ),
    path: faqSectionPath(section.id),
    title: sectionTitle(section.title),
  });
}

/** Sidebar groups and previous/next, following the FAQ topic order. */
function navigation(sectionId: string) {
  const titles = new Map(
    SITE_FAQ_SECTIONS.map((section) => [section.id, section.title]),
  );
  const groups = FAQ_NAV_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    sections: group.sectionIds
      .filter((id) => titles.has(id))
      .map((id) => ({ id, title: titles.get(id)! })),
  })).filter((group) => group.sections.length);
  const order = groups.flatMap((group) => group.sections);
  const index = order.findIndex((section) => section.id === sectionId);
  return {
    groups,
    next: index >= 0 ? (order[index + 1] ?? null) : null,
    previous: index > 0 ? order[index - 1]! : null,
  };
}

export default async function FaqSectionPage({ params }: PageProps) {
  const section = await getSiteFaqSection(params.section);
  if (!section) notFound();
  const { groups, next, previous } = navigation(section.id);
  const url = absoluteUrl(faqSectionPath(section.id));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: section.items.map((item) => ({
              "@type": "Question",
              acceptedAnswer: { "@type": "Answer", text: item.answer },
              name: item.question,
            })),
            name: `${section.title} FAQ`,
            url,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", item: absoluteUrl("/"), name: "Home", position: 1 },
              { "@type": "ListItem", item: absoluteUrl("/faq"), name: "FAQ", position: 2 },
              { "@type": "ListItem", item: url, name: section.title, position: 3 },
            ],
          },
        ]}
      />

      <FaqSectionView
        description={section.description}
        groups={groups}
        items={section.items}
        next={next}
        previous={previous}
        sectionId={section.id}
        title={section.title}
      />
    </>
  );
}
