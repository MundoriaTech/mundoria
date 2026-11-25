/**
 * "20% off your first clean" (Meta ads page). Like the free-hour offer, a
 * callback lead with this source unlocks the discount on the customer's
 * first booking, matched by the same email or phone. One offer per first
 * booking: never combined with the free hour, and a promo code only wins
 * when it is the bigger discount.
 */
export const META_OFFER_SOURCE = "meta-20-off";
export const PERCENT_OFFER_SOURCES = [META_OFFER_SOURCE] as const;
export const PERCENT_OFFER_PERCENT = 20;
export const PERCENT_OFFER_KIND = "percent_20";

export function isMetaOfferSource(source: string | null | undefined) {
  return (PERCENT_OFFER_SOURCES as readonly string[]).includes(String(source ?? ""));
}

export function percentOfferDiscountPence(totalPence: number) {
  return Math.round((Math.max(0, totalPence) * PERCENT_OFFER_PERCENT) / 100);
}
