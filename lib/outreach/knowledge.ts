/**
 * The fact sheet the AI answers from (replies and the voice assistant brief).
 * Built from the same sources as the website: the live admin rate card and the
 * FAQ catalogue, so the AI never contradicts the site.
 */

import { loadServicePricing } from "@/lib/customer/pricing-config";
import { applyPricingFaqOverrides, fromRateLabel } from "@/lib/customer/published-pricing";
import { SITE_FAQ_CATALOGUE } from "@/lib/seo/site-faq-catalogue";
import type { ServiceType } from "@/types/customer";

/** FAQ sections customers actually ask about in replies. */
const SECTIONS = [
  "about-mundoria",
  "booking",
  "pricing",
  "payments",
  "cancellations",
  "professionals",
  "matching",
  "safety",
  "problems",
  "coverage",
  "recurring",
  "preparing",
  "products",
  "access",
  "regular-home",
  "deep-cleaning",
  "moving",
  "short-let",
  "office",
  "recovery",
];

const PRICED_SERVICES: Array<[ServiceType, string]> = [
  ["regular", "Regular house cleaning"],
  ["one_off", "One-off cleaning"],
  ["deep_clean", "Deep cleaning"],
  ["end_of_tenancy", "End of tenancy"],
  ["move_in", "Move-in cleaning"],
  ["move_out", "Move-out cleaning"],
  ["airbnb_turnover", "Airbnb / short-let turnover"],
  ["office", "Office cleaning"],
  ["pregnancy_support", "Recovery cleaning (pregnancy, postpartum, illness, injury, hospital discharge, bereavement)"],
];

const MAX_ANSWER_CHARS = 900;
let cached: { at: number; text: string } | null = null;

export async function buildKnowledge() {
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.text;

  const pricing = await loadServicePricing();
  const prices = PRICED_SERVICES.map(([type, label]) => `- ${label}: from ${fromRateLabel(type, pricing)}`).join("\n");

  const faq = SITE_FAQ_CATALOGUE.filter((section) => SECTIONS.includes(section.id))
    .map((section) => {
      const items = applyPricingFaqOverrides(section.items, pricing)
        .map((item) => {
          const answer = item.answer.replace(/\n{2,}/g, " ").replace(/\s+/g, " ").trim();
          return `Q: ${item.question}\nA: ${answer.length > MAX_ANSWER_CHARS ? `${answer.slice(0, MAX_ANSWER_CHARS)}…` : answer}`;
        })
        .join("\n");
      return `## ${section.title}\n${items}`;
    })
    .join("\n\n");

  const text = `# Mundoria facts (authoritative; never contradict these)

Mundoria is a UK cleaning marketplace based in Birmingham (website www.mundoria.co.uk). Customers book online; independent, vetted cleaners do the work.

## Live prices (admin rate card, per hour)
${prices}

## Rules that are always true
- Booking: the card is saved at booking with no charge.
- A payment hold is placed from 5 days before the clean, or straight away if the cleaner accepts later than that (up to five attempts). If it can't be authorised by 24 hours before, the booking is cancelled free of charge.
- Payment is taken the day after the clean.
- Cancellation is free 24 hours or more before the start time; within 24 hours the full price is charged.
- Rescheduling (Change date & time) is possible from the booking page 48 hours or more ahead, to a new time at least 48 hours away. Within 48 hours the customer can only cancel.
- Cleaners: identity and right to work, Basic DBS where applicable, at least £1 million Public Liability insurance, and an interview before approval. Never call them trained, certified or referenced.
- Customers supply products and equipment unless they add the Mundoria supplies add-on at booking.
- Free-hour offer (ads page and site popup): book 2 hours of house cleaning and get 1 hour free. There is no promo code. At checkout we match the callback lead (same email or phone), charge 2 hours, and put 3 hours on the first booking. Later visits are charged as booked. The offer is once per customer.
- 20% off offer (Meta ads page /20-off-first-clean): 20% off the total of the customer's first booking. No promo code: at checkout we match the callback lead (same email or phone) and take 20% off. It applies to the first visit only (repeat visits are full price), can't be combined with the free hour, and if they also have a promo code they get whichever discount is bigger. Once per customer.
- Book online at www.mundoria.co.uk/booking/new. Support: reply to the message, or the chat at www.mundoria.co.uk/contact.

## FAQ
${faq}`;

  cached = { at: Date.now(), text };
  return text;
}
