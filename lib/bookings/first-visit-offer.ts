import { serviceDefinition } from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";

/** Callback sources that unlock the first-visit extra hour. */
export const FIRST_VISIT_OFFER_SOURCES = [
  "book-2-get-1-free",
  "site-popup-1h-free",
] as const;

export const FIRST_VISIT_OFFER_FREE_HOURS = 1;
export const FIRST_VISIT_OFFER_MIN_HOURS = 2;
/** Session picker max is 12h; adding a gift hour would overflow that cap. */
export const FIRST_VISIT_OFFER_MAX_SESSION_HOURS = 11;

export function firstVisitOfferAppliesToService(serviceType: string) {
  try {
    return serviceDefinition(serviceType as ServiceType).category === "residential";
  } catch {
    return false;
  }
}

export function firstVisitOfferSessionEligible(durationHours: number | null | undefined) {
  if (durationHours == null || !Number.isFinite(durationHours)) return false;
  return (
    durationHours >= FIRST_VISIT_OFFER_MIN_HOURS &&
    durationHours <= FIRST_VISIT_OFFER_MAX_SESSION_HOURS
  );
}

/** Last 10 national digits so +44 7… and 07… match. */
export function ukPhoneMatchKey(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  let national = digits;
  if (national.startsWith("44") && national.length >= 12) {
    national = national.slice(2);
  }
  if (national.startsWith("0") && national.length >= 11) {
    national = national.slice(1);
  }
  return national.slice(-10);
}
