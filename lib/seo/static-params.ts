import { BIRMINGHAM_AREAS, MARKETING_SERVICES } from "@/lib/seo/marketing";

/**
 * Neighbourhoods prerendered at build time for SEO hubs.
 * Remaining Birmingham coverage places stay in the sitemap and render on demand
 * (`dynamicParams = true`) so Vercel builds stay fast.
 */
export function priorityBirminghamAreaSlugs(): string[] {
  return BIRMINGHAM_AREAS.map((area) => area.slug);
}

/** Service × priority-area combos for `/cleaning/[slug]/birmingham/[area]`. */
export function priorityServiceAreaStaticParams() {
  const areas = priorityBirminghamAreaSlugs();
  return MARKETING_SERVICES.flatMap((service) =>
    areas.map((area) => ({
      area,
      slug: service.slug,
    })),
  );
}
