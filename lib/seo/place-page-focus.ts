import type { CoverageLinkFocus } from "@/lib/seo/birmingham-coverage";
import { marketingServiceBySlug } from "@/lib/seo/marketing";

export type PlacePageFocus = CoverageLinkFocus & {
  serviceLabel?: string;
};

const CATEGORIES = ["commercial", "recovery", "residential"] as const;

export function readPlacePageFocus(searchParams: {
  category?: string | string[];
  service?: string | string[];
}): PlacePageFocus {
  const categoryRaw = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category;
  const serviceRaw = Array.isArray(searchParams.service)
    ? searchParams.service[0]
    : searchParams.service;
  const service = serviceRaw ? marketingServiceBySlug(serviceRaw) : null;
  if (service) {
    return { serviceLabel: service.label, serviceSlug: service.slug };
  }
  const category = CATEGORIES.find((item) => item === categoryRaw);
  return category ? { category } : {};
}

export function cleaningPlaceTitle({
  category,
  place,
  preposition,
  serviceLabel,
}: {
  category?: PlacePageFocus["category"];
  place: string;
  preposition: "in" | "near";
  serviceLabel?: string;
}) {
  if (serviceLabel) return `${serviceLabel} ${preposition} ${place}`;
  if (category === "commercial") return `Workspace cleaners ${preposition} ${place}`;
  if (category === "recovery") return `Recovery cleaners ${preposition} ${place}`;
  if (category === "residential" || preposition === "in") {
    return `Domestic cleaners ${preposition} ${place}`;
  }
  return `Cleaners near ${place}`;
}

export function cleaningPlaceIntro({
  category,
  scope,
  serviceLabel,
}: {
  category?: PlacePageFocus["category"];
  scope: "places" | "towns";
  serviceLabel?: string;
}) {
  const where = scope === "towns" ? "towns" : "places";
  if (serviceLabel) {
    return `${serviceLabel} is available in these ${where} and their surroundings:`;
  }
  if (category === "commercial") {
    return `Workspace cleaning is available in these ${where} and their surroundings:`;
  }
  if (category === "recovery") {
    return `Recovery cleaning is available in these ${where} and their surroundings:`;
  }
  if (category === "residential") {
    return `Domestic cleaning is available in these ${where} and their surroundings:`;
  }
  return `Mundoria cleaners are available in these ${where} and their surroundings:`;
}

export function surroundingTownsIntro({
  category,
  serviceLabel,
}: {
  category?: PlacePageFocus["category"];
  serviceLabel?: string;
}) {
  if (serviceLabel) {
    return `${serviceLabel} is also available in these surrounding towns:`;
  }
  if (category === "commercial") {
    return "Workspace cleaning is also available in these surrounding towns:";
  }
  if (category === "recovery") {
    return "Recovery cleaning is also available in these surrounding towns:";
  }
  if (category === "residential") {
    return "Domestic cleaning is also available in these surrounding towns:";
  }
  return "Mundoria cleaners are also available in these surrounding towns:";
}

export function bookingHrefForFocus(
  configured: boolean,
  focus: PlacePageFocus,
) {
  if (!configured) return "/setup";
  if (focus.serviceSlug) {
    const service = marketingServiceBySlug(focus.serviceSlug);
    if (service) return service.bookingHref;
  }
  if (focus.category) return `/booking/new?category=${focus.category}`;
  return "/booking/new";
}
