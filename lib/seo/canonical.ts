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

/**
 * Area consolidation map.
 * Thin / duplicate area pages redirect to these high-authority hubs.
 */
export const SEO_AREA_REDIRECTS: Record<string, string> = {
  // Central Hub
  digbeth: "birmingham-city-centre",
  eastside: "birmingham-city-centre",
  southside: "birmingham-city-centre",
  "chinese-quarter": "birmingham-city-centre",
  "gay-village": "birmingham-city-centre",
  "colmore-business-district": "birmingham-city-centre",
  brindleyplace: "birmingham-city-centre",
  "broad-street": "birmingham-city-centre",
  westside: "birmingham-city-centre",
  ladywood: "birmingham-city-centre",
  "lee-bank": "birmingham-city-centre",
  "park-central": "birmingham-city-centre",
  "attwood-green": "birmingham-city-centre",
  highgate: "birmingham-city-centre",
  bordesley: "birmingham-city-centre",
  "five-ways": "birmingham-city-centre",
  "gun-quarter": "birmingham-city-centre",
  newtown: "birmingham-city-centre",

  // West Hub (Edgbaston / Harborne)
  "north-edgbaston": "edgbaston-and-harborne",
  "chad-valley": "edgbaston-and-harborne",
  "calthorpe-estate": "edgbaston-and-harborne",
  "moor-pool": "edgbaston-and-harborne",
  summerfield: "edgbaston-and-harborne",
  "rotton-park": "edgbaston-and-harborne",
  "winson-green": "edgbaston-and-harborne",
  soho: "edgbaston-and-harborne",
  "cape-hill": "edgbaston-and-harborne",
  "bearwood-sandwell": "edgbaston-and-harborne",
  quinton: "edgbaston-and-harborne",
  "bartley-green": "edgbaston-and-harborne",
  woodgate: "edgbaston-and-harborne",
  california: "selly-oak-and-bournville", // California is also in south-west, map to the hub

  // South-West Hub (Selly Oak / Bournville)
  "selly-park": "selly-oak-and-bournville",
  bournbrook: "selly-oak-and-bournville",
  cotteridge: "selly-oak-and-bournville",
  stirchley: "selly-oak-and-bournville",
  "weoley-castle": "selly-oak-and-bournville",
  "weoley-hill": "selly-oak-and-bournville",
  northfield: "selly-oak-and-bournville",
  longbridge: "selly-oak-and-bournville",
  "west-heath": "selly-oak-and-bournville",
  "kings-norton": "selly-oak-and-bournville",
  hawkesley: "selly-oak-and-bournville",
  monyhull: "selly-oak-and-bournville",
  "druids-heath": "selly-oak-and-bournville",
  frankley: "selly-oak-and-bournville",
  "new-frankley": "selly-oak-and-bournville",
  rednal: "selly-oak-and-bournville",
  rubery: "selly-oak-and-bournville",
  "turves-green": "selly-oak-and-bournville",
  "shenley-fields": "selly-oak-and-bournville",
  "shenley-green": "selly-oak-and-bournville",
  "allens-cross": "selly-oak-and-bournville",

  // South Hub (Moseley / Kings Heath)
  "balsall-heath": "moseley-and-kings-heath",
  sparkbrook: "moseley-and-kings-heath",
  sparkhill: "moseley-and-kings-heath",
  springfield: "moseley-and-kings-heath",
  "hall-green": "moseley-and-kings-heath",
  "wake-green": "moseley-and-kings-heath",
  billesley: "moseley-and-kings-heath",
  brandwood: "moseley-and-kings-heath",
  "yardley-wood": "moseley-and-kings-heath",
  warstock: "moseley-and-kings-heath",
  "highters-heath": "moseley-and-kings-heath",
  maypole: "moseley-and-kings-heath",
  "brook-lane": "moseley-and-kings-heath",
  "cole-valley": "moseley-and-kings-heath",
  tyseley: "moseley-and-kings-heath",
  "acocks-green": "moseley-and-kings-heath",

  // North-West Hub (Aston / Handsworth)
  "aston-manor": "aston-and-handsworth",
  birchfield: "aston-and-handsworth",
  witton: "aston-and-handsworth",
  lozells: "aston-and-handsworth",
  "handsworth-wood": "aston-and-handsworth",
  "perry-barr": "aston-and-handsworth",
  "perry-hall": "aston-and-handsworth",
  "great-barr": "aston-and-handsworth",
  hamstead: "aston-and-handsworth",
  kingstanding: "aston-and-handsworth",
  oscott: "aston-and-handsworth",
  "old-oscott": "aston-and-handsworth",
  "new-oscott": "aston-and-handsworth",
  queslett: "aston-and-handsworth",
  "tower-hill": "aston-and-handsworth",
  "perry-beeches": "aston-and-handsworth",
  "college-road": "aston-and-handsworth",
  brookvale: "aston-and-handsworth",
  holford: "aston-and-handsworth",
  holyhead: "aston-and-handsworth",

  // North-East Hub (Erdington)
  "gravelly-hill": "erdington",
  "stockland-green": "erdington",
  "short-heath": "erdington",
  "perry-common": "erdington",
  "pype-hayes": "erdington",
  tyburn: "erdington",
  "castle-vale": "erdington",
  bromford: "erdington",
  "birches-green": "erdington",
  "spring-hill": "erdington",
  "chester-road": "erdington",
  "minworth-birmingham-side": "erdington",
  "the-gardens": "erdington",
  "lyndhurst-estate": "erdington",

  // East Hub (Alum Rock / Hodge Hill)
  saltley: "alum-rock-and-hodge-hill",
  "washwood-heath": "alum-rock-and-hodge-hill",
  "ward-end": "alum-rock-and-hodge-hill",
  "shard-end": "alum-rock-and-hodge-hill",
  "tile-cross": "alum-rock-and-hodge-hill",
  "glebe-farm": "alum-rock-and-hodge-hill",
  stechford: "alum-rock-and-hodge-hill",
  "kitts-green": "alum-rock-and-hodge-hill",
  "lea-village": "alum-rock-and-hodge-hill",
  "garretts-green": "alum-rock-and-hodge-hill",
  "bordesley-green": "alum-rock-and-hodge-hill",
  "small-heath": "alum-rock-and-hodge-hill",
  nechells: "alum-rock-and-hodge-hill",
  duddeston: "alum-rock-and-hodge-hill",
  vauxhall: "alum-rock-and-hodge-hill",
  ashted: "alum-rock-and-hodge-hill",
  heartlands: "alum-rock-and-hodge-hill",
  pelham: "alum-rock-and-hodge-hill",

  // South-East Hub (Yardley / Sheldon)
  "south-yardley": "yardley-and-sheldon",
  "yardley-east": "yardley-and-sheldon",
  "yardley-west": "yardley-and-sheldon",
  sheldon: "yardley-and-sheldon",
  gilbertstone: "yardley-and-sheldon",
  "lyndon-green": "yardley-and-sheldon",
  "wells-green": "yardley-and-sheldon",
  "hay-mills": "yardley-and-sheldon",
  "olton-boulevard-east": "yardley-and-sheldon",

  // Sutton Hub
  "four-oaks": "sutton-coldfield",
  "mere-green": "sutton-coldfield",
  "little-aston": "sutton-coldfield",
  streetly: "sutton-coldfield",
  boldmere: "sutton-coldfield",
  "wylde-green": "sutton-coldfield",
  walmley: "sutton-coldfield",
  "new-hall": "sutton-coldfield",
  reddicap: "sutton-coldfield",
  roughley: "sutton-coldfield",
  "hill-hook": "sutton-coldfield",
  "doe-bank": "sutton-coldfield",
  "whitehouse-common": "sutton-coldfield",
  "falcon-lodge": "sutton-coldfield",
  maney: "sutton-coldfield",
  "banners-gate": "sutton-coldfield",
  plantsbrook: "sutton-coldfield",
  "sutton-park": "sutton-coldfield",
  langley: "sutton-coldfield",
  minworth: "sutton-coldfield",
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

/** Whether this area slug is a high-authority hub that should be indexed. */
export function isIndexableAreaSlug(slug: string): boolean {
  return !(slug in SEO_AREA_REDIRECTS);
}

/** Path for a marketing area slug after canonicalisation. */
export function canonicalAreaPath(slug: string): string {
  return cleanerPlacePath(SEO_AREA_REDIRECTS[slug] ?? slug);
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
  "cradley-heath",
  "coleshill",
  "water-orton",
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
]);

export function cleanerPlacePath(areaSlug: string): string {
  // The city itself is the hub, not a place under it (/cleaners/birmingham/birmingham 404s).
  if (areaSlug === "birmingham") return "/cleaners/birmingham";
  if (STANDALONE_TOWN_SLUGS.has(areaSlug)) {
    return `/cleaners/${areaSlug}`;
  }
  return `/cleaners/birmingham/${areaSlug}`;
}

export function isStandaloneTownSlug(slug: string): boolean {
  return STANDALONE_TOWN_SLUGS.has(slug);
}

/**
 * Rewrite an internal link that points at a retired URL to its live
 * canonical target, so editorial content (Mag posts, Help articles) never
 * links through a redirect. External and unknown links pass through.
 */
export function canonicalInternalHref(href: string): string {
  if (!href.startsWith("/")) return href;
  const [pathAndQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const suffix = `${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;

  const service = path.match(/^\/cleaning\/([^/]+)\/?$/);
  if (service && service[1] in SEO_SERVICE_REDIRECTS) {
    return `${canonicalCleaningPath(service[1])}${suffix}`;
  }
  const area = path.match(/^\/cleaners\/birmingham\/([^/]+)\/?$/);
  if (area && (area[1] in SEO_AREA_REDIRECTS || STANDALONE_TOWN_SLUGS.has(area[1]))) {
    return `${canonicalAreaPath(area[1])}${suffix}`;
  }
  return href;
}
