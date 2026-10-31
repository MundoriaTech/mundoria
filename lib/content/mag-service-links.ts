import {
  LAUNCH_CITY,
  publicMarketingServices,
  servicePlacePath,
} from "@/lib/seo/marketing";

/** Public marketing services editors can attach to Mag posts. */
export function magServiceOptions() {
  return publicMarketingServices().map((service) => ({
    category: service.categoryLabel,
    label: service.label,
    slug: service.slug,
  }));
}

export function normalizeRelatedServices(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(publicMarketingServices().map((item) => item.slug));
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => allowed.has(item)),
    ),
  );
}

export function serviceMoneyPath(serviceSlug: string) {
  return `/cleaning/${serviceSlug}`;
}

export function serviceCityMoneyPath(serviceSlug: string) {
  return servicePlacePath(serviceSlug);
}

/** Insertable closing CTA for Mag drafts, service page + city page + booking. */
export function magMoneyPageCtaMarkdown(serviceSlug: string, label: string) {
  const servicePath = serviceMoneyPath(serviceSlug);
  const cityPath = serviceCityMoneyPath(serviceSlug);
  return [
    "",
    `Ready to book? See [${label}](${servicePath}), check [${label} in ${LAUNCH_CITY.name}](${cityPath}), or [start a booking](/booking/new).`,
    "",
  ].join("\n");
}
