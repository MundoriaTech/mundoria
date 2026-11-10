/**
 * FAQ URL helpers. Pure functions with no data imports, so client components
 * and emails can build links without pulling in the catalogue.
 *
 * Each catalogue section has its own page at `/faq/<section id>`, and each
 * answer has a stable anchor on that page.
 */

export const FAQ_HUB_PATH = "/faq";

/** Stable in-page anchor for a FAQ question. */
export function faqItemAnchor(sectionId: string, question: string) {
  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${sectionId}-${slug || "q"}`;
}

export function faqSectionPath(sectionId: string) {
  return `${FAQ_HUB_PATH}/${sectionId}`;
}

export function faqItemPath(sectionId: string, question: string) {
  return `${faqSectionPath(sectionId)}#${faqItemAnchor(sectionId, question)}`;
}

/**
 * Before the split, every answer lived on `/faq` with `#<section>` or
 * `#<section>-<question>` anchors (still in sent emails and bookmarks).
 * Returns the category page that now holds that hash, or null.
 */
export function legacyFaqHashTarget(hash: string, sectionIds: readonly string[]) {
  const id = hash.replace(/^#/, "");
  if (!id) return null;
  // Longest match first: "recurring" must not swallow a longer id.
  const sectionId = [...sectionIds]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => id === candidate || id.startsWith(`${candidate}-`));
  if (!sectionId) return null;
  return id === sectionId
    ? faqSectionPath(sectionId)
    : `${faqSectionPath(sectionId)}#${id}`;
}
