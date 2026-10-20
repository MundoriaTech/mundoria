import { faqItemAnchor } from "@/lib/seo/site-faqs";

/** Path to a specific FAQ answer (`/faq#…`). */
export function faqItemHref(sectionId: string, question: string) {
  return `/faq#${faqItemAnchor(sectionId, question)}`;
}

export function faqSectionHref(sectionId: string) {
  return `/faq#${sectionId}`;
}

/**
 * Named deep links for high-friction topics (support, booking, emails).
 * Prefer these over hardcoding hashes so anchors stay in sync with the catalogue.
 */
export const FAQ_LINKS = {
  accessFailed: faqItemHref(
    "access",
    "What happens if the cleaner cannot gain access?",
  ),
  accessNotHome: faqItemHref(
    "booking",
    "How do I provide access if I am not home?",
  ),
  cancelBooking: faqItemHref("cancellations", "Can I cancel my booking?"),
  cancellationFee: faqItemHref(
    "cancellations",
    "Is there a cancellation fee?",
  ),
  cancelNotice: faqItemHref(
    "cancellations",
    "How much notice do I need to cancel?",
  ),
  cancellations: faqSectionHref("cancellations"),
  paymentFails: faqItemHref(
    "payments",
    "What happens if my payment fails?",
  ),
  payments: faqSectionHref("payments"),
  pricing: faqSectionHref("pricing"),
  refundOnCancel: faqItemHref(
    "payments",
    "Can I get a refund if my booking is cancelled?",
  ),
  whenCharged: faqItemHref("payments", "When will I be charged?"),
} as const;
