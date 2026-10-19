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

/** Site-wide FAQ catalogue — full category list with answers filled over time. */
export const SITE_FAQ_SECTIONS: SiteFaqSection[] = SITE_FAQ_CATALOGUE.filter(
  (section) => section.items.length > 0,
);

export function allSiteFaqs(): SiteFaqItem[] {
  return uniqueFaqs(SITE_FAQ_SECTIONS.flatMap((section) => section.items));
}

/** Stable in-page anchor for a FAQ question. */
export function faqItemAnchor(sectionId: string, question: string) {
  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${sectionId}-${slug || "q"}`;
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
      href: `/faq#${section.id}`,
      kind: "section",
      label: section.title,
    }));

    const allQuestions = sections.flatMap((section) =>
      section.items.map((item) => ({
        href: `/faq#${faqItemAnchor(section.id, item.question)}`,
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
