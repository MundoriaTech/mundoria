/**
 * The customer journey on /how-it-works, written against the live platform:
 * card saved at booking, hold from 48h once a cleaner is assigned, capture the
 * day after the clean, free cancellation at 24h or more. Prices come from the
 * admin rate card, never hard-coded.
 */
import {
  DEFAULT_SERVICE_PRICING,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";
import {
  houseCleaningFromLabel,
  supplyRateCopy,
} from "@/lib/customer/published-pricing";

export type JourneyStep = { body: string; title: string };
export type JourneyCase = { body: string; title: string };

export function howItWorksSteps(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): JourneyStep[] {
  const supply = supplyRateCopy(pricing);
  return [
    {
      title: "Tell us what needs cleaning",
      body: "Choose Home, Moving, Work or Recovery, then the service that fits the job. Recovery is household cleaning for harder moments, not medical or personal care.",
    },
    {
      title: "Add the property",
      body: "Enter the address, property type, bedrooms, bathrooms and condition, plus access, parking, pets and anything to avoid. Matching works from your full postcode.",
    },
    {
      title: "Choose your time and supplies",
      body: `Pick a date and arrival time. Use your own products and equipment, or add Mundoria's product kit (${supply.productsResidential}) or equipment (${supply.equipmentDefault}), and extras such as inside the oven or fridge.`,
    },
    {
      title: "See the price before you commit",
      body: `Before you confirm you see the hourly rate, the estimated hours, any extras and early, evening or weekend rates, the full price and the cancellation rule. House cleaning starts from ${houseCleaningFromLabel(pricing)}, and there is no booking fee.`,
    },
    {
      title: "Save your card and request the clean",
      body: "Your card is saved securely with Stripe. Nothing is charged at this point, and your booking is a request until a cleaner accepts it.",
    },
    {
      title: "Matching and payment hold",
      body: "Mundoria matches a suitable cleaner on service, postcode, availability and reliability, and tells you when one is confirmed. From 48 hours before the visit, a temporary hold is placed on your card. If it cannot be placed by 24 hours before, the booking is cancelled free of charge.",
    },
    {
      title: "The cleaning day",
      body: "Your cleaner arrives, checks your priorities and cleans what you booked. You can follow arrival and progress live and message them in the app. Payment always stays on Mundoria, never cash to the cleaner.",
    },
    {
      title: "Completion, payment and feedback",
      body: "When the job is done you confirm it, or tell us if something is not right. Payment is taken the day after the clean, and you can rate the visit. Only customers with a completed booking can leave a rating.",
    },
  ];
}

export function howItWorksPlanChanges(): JourneyCase[] {
  return [
    {
      title: "You need to cancel or reschedule",
      body: "Free 24 hours or more before the start time. Within 24 hours the full booking price is charged, because the cleaner has set that time aside. Your statutory consumer rights are not affected.",
    },
    {
      title: "Your cleaner cannot make it",
      body: "Mundoria looks for a suitable replacement. If no one can take the visit, you are offered another time or the booking is cancelled, and you are not charged for a clean that did not happen.",
    },
    {
      title: "The cleaner cannot get in",
      body: "After a 5-minute grace period on arrival, a waiting charge of £0.50 a minute can apply while access is sorted. If it cannot be arranged, the clean may be shortened, rescheduled or cancelled.",
    },
    {
      title: "Something is damaged or not right",
      body: "Report it through Mundoria with photos where useful, and it is reviewed on its facts. Every cleaner must hold at least £1 million of Public Liability insurance, though no policy covers every loss.",
    },
  ];
}

export function howItWorksReturning(): JourneyCase[] {
  return [
    {
      title: "Set a routine",
      body: "Choose weekly, fortnightly or monthly visits, and your property details and preferences carry over.",
    },
    {
      title: "Ask for the same cleaner",
      body: "You can request the same person each time. Mundoria tries to keep that continuity, but it cannot be guaranteed, and a replacement is found when they are away.",
    },
    {
      title: "Stop whenever you like",
      body: "There is no subscription or minimum term. Each visit follows the same 24-hour cancellation rule as a one-off booking.",
    },
  ];
}
