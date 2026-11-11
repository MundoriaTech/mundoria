import {
  loadServicePricing,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";
import { applyPricingFaqOverrides } from "@/lib/customer/published-pricing";
import {
  faqItemAnchor,
  faqItemPath,
  faqSectionPath,
} from "@/lib/seo/faq-paths";
import {
  FAQ_NAV_GROUPS,
  SITE_FAQ_CATALOGUE,
} from "@/lib/seo/site-faq-catalogue";

export type SiteFaqItem = {
  answer: string;
  question: string;
};

export type SiteFaqSection = {
  description: string;
  id: string;
  items: SiteFaqItem[];
  title: string;
};

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/\bin birmingham\b/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueFaqs(items: SiteFaqItem[]): SiteFaqItem[] {
  const seen = new Set<string>();
  const result: SiteFaqItem[] = [];
  for (const item of items) {
    const key = normalizeQuestion(item.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Site-wide FAQ catalogue, full category list with answers filled over time. */
export const SITE_FAQ_SECTIONS: SiteFaqSection[] = SITE_FAQ_CATALOGUE.filter(
  (section) => section.items.length > 0,
);

/** Apply admin rate-card amounts to FAQ answers that mention £/h pricing. */
export function siteFaqSectionsWithPricing(
  pricing: ServicePricingConfig,
): SiteFaqSection[] {
  return SITE_FAQ_SECTIONS.map((section) => ({
    ...section,
    items: applyPricingFaqOverrides(section.items, pricing),
  }));
}

export async function getSiteFaqSections() {
  return siteFaqSectionsWithPricing(await loadServicePricing());
}

export function allSiteFaqs(
  sections: SiteFaqSection[] = SITE_FAQ_SECTIONS,
): SiteFaqItem[] {
  return uniqueFaqs(sections.flatMap((section) => section.items));
}

export async function getAllSiteFaqs() {
  return allSiteFaqs(await getSiteFaqSections());
}

export { faqItemAnchor };

export async function getSiteFaqSection(id: string) {
  const sections = await getSiteFaqSections();
  return sections.find((section) => section.id === id) ?? null;
}

export const SITE_FAQ_SECTION_IDS = SITE_FAQ_SECTIONS.map((section) => section.id);

/** Most-asked questions shown (and marked up) on the FAQ hub. */
export const FAQ_TOP_QUESTIONS: ReadonlyArray<[sectionId: string, question: string]> = [
  ["pricing", "How much does Mundoria cost?"],
  ["payments", "When will I be charged?"],
  ["cancellations", "Is there a cancellation fee?"],
  ["safety", "What checks does Mundoria carry out on cleaners?"],
  ["safety", "Are cleaners insured?"],
  ["booking", "Do I need to be at home during the clean?"],
  ["products", "Do I need to provide cleaning products?"],
  ["matching", "Can I choose my cleaner?"],
  ["coverage", "Which areas does Mundoria cover?"],
  ["about-mundoria", "Is Mundoria a cleaning company?"],
];

export function topSiteFaqs(sections: SiteFaqSection[]) {
  const byId = new Map(sections.map((section) => [section.id, section]));
  return FAQ_TOP_QUESTIONS.flatMap(([sectionId, question]) => {
    const item = byId.get(sectionId)?.items.find((entry) => entry.question === question);
    return item ? [{ ...item, sectionId }] : [];
  });
}

export type FaqNavMenuItem = {
  href: string;
  kind: "section" | "question";
  label: string;
};

export type FaqNavMenu = {
  description: string;
  href: string;
  id: string;
  items: FaqNavMenuItem[];
  label: string;
  questionCount: number;
};

const FAQ_NAV_PREVIEW = 6;

/**
 * Floating-nav menus: 7 topic groups. Each dropdown lists section titles plus
 * a short preview of questions from those sections.
 */
export function faqNavMenus(): FaqNavMenu[] {
  const byId = new Map(
    SITE_FAQ_SECTIONS.map((section) => [section.id, section]),
  );

  return FAQ_NAV_GROUPS.map((group) => {
    const sections = group.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is SiteFaqSection => Boolean(section));

    const sectionLinks: FaqNavMenuItem[] = sections.map((section) => ({
      href: faqSectionPath(section.id),
      kind: "section",
      label: section.title,
    }));

    const allQuestions = sections.flatMap((section) =>
      section.items.map((item) => ({
        href: faqItemPath(section.id, item.question),
        kind: "question" as const,
        label: item.question,
      })),
    );

    return {
      description: group.description,
      href: sectionLinks[0]?.href ?? "/faq",
      id: group.id,
      items: [...sectionLinks, ...allQuestions.slice(0, FAQ_NAV_PREVIEW)],
      label: group.label,
      questionCount: allQuestions.length,
    };
  });
}
