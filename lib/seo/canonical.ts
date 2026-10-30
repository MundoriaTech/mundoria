/**
 * Lean SEO map: one indexable page per service intent, one per area.
 * Duplicate / thin URLs permanent-redirect here so Google stops splitting trust.
 */

/** Marketing URL slug → canonical public slug (or category hub). */
export const SEO_SERVICE_REDIRECTS: Record<string, string> = {
  // Move-out twin → one Move-in / move-out page (end of tenancy stays separate)
  "move-out-cleaning": "move-in-move-out-cleaning",
  // Short-let cluster → one guest-turnover page (+ serviced stays separate)
  "holiday-let-cleaning": "airbnb-shortlet-cleaning",
  // Recovery twins
  "postpartum-cleaning": "pregnancy-and-postpartum-cleaning",
  "injury-recovery-cleaning": "illness-and-injury-recovery",
  // Legacy / hidden residential
  "same-day-cleaning": "one-off-cleaning",
};

/** Path for a marketing service slug after canonicalisation. */
export function canonicalCleaningPath(slug: string): string {
  const target = SEO_SERVICE_REDIRECTS[slug] ?? slug;
  if (target.startsWith("/")) return target;
  return `/cleaning/${target}`;
}

/** Whether this marketing slug should appear in the sitemap as its own page. */
export function isIndexableServiceSlug(slug: string): boolean {
  return !(slug in SEO_SERVICE_REDIRECTS);
}

/**
 * Standalone town pages (not under /birmingham/).
 * These places are outside Birmingham city but were previously nested there.
 */
export const STANDALONE_TOWN_SLUGS = new Set([
  "solihull",
  "shirley",
  "olton",
  "walsall",
  "west-bromwich",
  "halesowen",
  "bromsgrove",
  "smethwick",
  "oldbury",
  "rowley-regis",
  "aldridge",
  "knowle",
  "dorridge",
  "wythall",
  "hollywood",
  "alvechurch",
  "barnt-green",
  "marston-green",
  "chelmsley-wood",
  "castle-bromwich",
  "bearwood",
  "bearwood-sandwell",
]);

export function cleanerPlacePath(areaSlug: string): string {
  if (STANDALONE_TOWN_SLUGS.has(areaSlug)) {
    return `/cleaners/${areaSlug}`;
  }
  return `/cleaners/birmingham/${areaSlug}`;
}

export function isStandaloneTownSlug(slug: string): boolean {
  return STANDALONE_TOWN_SLUGS.has(slug);
}
