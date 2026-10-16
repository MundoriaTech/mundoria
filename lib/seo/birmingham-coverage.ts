import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";

export type CoverageArea = {
  label: string;
  note?: string;
  /** Set when this label must not share a page with the same name elsewhere. */
  slug?: string;
};

/** Towns under Birmingham, then the places inside each town. */
export type BirminghamCoverageZone = {
  id: string;
  /** Short name listed under Birmingham. */
  label: string;
  /** Full area title on the town page. */
  title: string;
  note?: string;
  areas: readonly CoverageArea[];
};

function places(...labels: string[]): CoverageArea[] {
  return labels.map((label) => ({ label }));
}

export const BIRMINGHAM_COVERAGE_ZONES: readonly BirminghamCoverageZone[] = [
  {
    id: "central",
    label: "Birmingham City Centre",
    title: "Birmingham City Centre & Central Birmingham",
    areas: places(
      "Birmingham City Centre",
      "Jewellery Quarter",
      "Digbeth",
      "Eastside",
      "Southside",
      "Chinese Quarter",
      "Gay Village",
      "Colmore Business District",
      "Brindleyplace",
      "Broad Street",
      "Westside",
      "Ladywood",
      "Lee Bank",
      "Park Central",
      "Attwood Green",
      "Highgate",
      "Bordesley",
      "Five Ways",
      "Gun Quarter",
      "Newtown",
    ),
  },
  {
    id: "west",
    label: "Edgbaston & Harborne",
    title: "Edgbaston, Harborne & West Birmingham",
    areas: [
      ...places(
        "Edgbaston",
        "Harborne",
        "North Edgbaston",
        "Chad Valley",
        "Calthorpe Estate",
        "Moor Pool",
        "Summerfield",
        "Rotton Park",
        "Winson Green",
        "Soho",
      ),
      { label: "Cape Hill", note: "Sandwell, neighbouring area" },
      {
        label: "Bearwood",
        note: "Sandwell, neighbouring area",
        slug: "bearwood-sandwell",
      },
      ...places("Quinton", "Bartley Green", "Woodgate", "California"),
    ],
  },
  {
    id: "south-west",
    label: "Selly Oak & Bournville",
    title: "Selly Oak, Bournville & South-West Birmingham",
    areas: [
      ...places(
        "Selly Oak",
        "Selly Park",
        "Bournbrook",
        "Bournville",
        "Cotteridge",
        "Stirchley",
        "Weoley Castle",
        "Weoley Hill",
        "California",
        "Northfield",
        "Longbridge",
        "West Heath",
        "Kings Norton",
        "Hawkesley",
        "Monyhull",
        "Druids Heath",
        "Frankley",
        "New Frankley",
        "Rednal",
      ),
      {
        label: "Rubery",
        note: "Birmingham-side properties; also extends outside the city",
      },
      ...places(
        "Turves Green",
        "Shenley Fields",
        "Shenley Green",
        "Allens Cross",
      ),
    ],
  },
  {
    id: "south",
    label: "Moseley & Kings Heath",
    title: "Moseley, Kings Heath & South Birmingham",
    areas: places(
      "Moseley",
      "Kings Heath",
      "Balsall Heath",
      "Sparkbrook",
      "Sparkhill",
      "Springfield",
      "Hall Green",
      "Wake Green",
      "Billesley",
      "Brandwood",
      "Yardley Wood",
      "Warstock",
      "Highters Heath",
      "Maypole",
      "Brook Lane",
      "Cole Valley",
      "Tyseley",
      "Acocks Green",
    ),
  },
  {
    id: "north-west",
    label: "Aston & Handsworth",
    title: "Aston, Handsworth & North-West Birmingham",
    areas: [
      ...places(
        "Aston",
        "Aston Manor",
        "Birchfield",
        "Witton",
        "Lozells",
        "Handsworth",
        "Handsworth Wood",
        "Perry Barr",
        "Perry Hall",
      ),
      { label: "Great Barr", note: "Birmingham sections" },
      { label: "Hamstead", note: "Birmingham sections" },
      ...places(
        "Kingstanding",
        "Oscott",
        "Old Oscott",
        "New Oscott",
        "Queslett",
        "Tower Hill",
        "Perry Beeches",
        "College Road",
        "Brookvale",
        "Holford",
        "Holyhead",
      ),
    ],
  },
  {
    id: "north-east",
    label: "Erdington",
    title: "Erdington & North-East Birmingham",
    areas: [
      ...places(
        "Erdington",
        "Gravelly Hill",
        "Stockland Green",
        "Short Heath",
        "Perry Common",
        "Pype Hayes",
        "Tyburn",
        "Castle Vale",
        "Bromford",
        "Birches Green",
        "Spring Hill",
        "Chester Road",
      ),
      {
        label: "Minworth",
        note: "Birmingham-side areas",
        slug: "minworth-birmingham-side",
      },
      ...places("The Gardens", "Lyndhurst Estate"),
    ],
  },
  {
    id: "east",
    label: "Alum Rock & Hodge Hill",
    title: "Alum Rock, Hodge Hill & East Birmingham",
    areas: places(
      "Alum Rock",
      "Saltley",
      "Washwood Heath",
      "Ward End",
      "Hodge Hill",
      "Shard End",
      "Tile Cross",
      "Glebe Farm",
      "Stechford",
      "Kitts Green",
      "Lea Village",
      "Garretts Green",
      "Bordesley Green",
      "Small Heath",
      "Nechells",
      "Duddeston",
      "Vauxhall",
      "Ashted",
      "Heartlands",
      "Pelham",
    ),
  },
  {
    id: "south-east",
    label: "Yardley & Sheldon",
    title: "Yardley, Sheldon & South-East Birmingham",
    areas: places(
      "Yardley",
      "South Yardley",
      "Yardley East",
      "Yardley West",
      "Sheldon",
      "Acocks Green",
      "Stechford",
      "Garretts Green",
      "Gilbertstone",
      "Lyndon Green",
      "Wells Green",
      "Hay Mills",
      "Tyseley",
      "Olton Boulevard East",
    ),
  },
  {
    id: "sutton",
    label: "Sutton Coldfield",
    title: "Sutton Coldfield & Northern Birmingham",
    areas: [
      ...places("Sutton Coldfield", "Four Oaks", "Mere Green"),
      { label: "Little Aston", note: "Staffordshire, nearby" },
      { label: "Streetly", note: "Walsall, nearby" },
      ...places(
        "Boldmere",
        "Wylde Green",
        "Walmley",
        "New Hall",
        "Reddicap",
        "Roughley",
        "Hill Hook",
        "Doe Bank",
        "Whitehouse Common",
        "Falcon Lodge",
        "Maney",
        "New Oscott",
        "Banners Gate",
        "Plantsbrook",
        "Sutton Park",
        "Langley",
        "Minworth",
      ),
    ],
  },
  {
    id: "border",
    label: "Nearby towns",
    title: "Birmingham Border Areas & Nearby Expansion Locations",
    note: "Just outside Birmingham. You can still book here when a cleaner is nearby.",
    areas: places(
      "Solihull",
      "Shirley",
      "Olton",
      "Hall Green / Solihull border",
      "Marston Green",
      "Chelmsley Wood",
      "Castle Bromwich",
      "Smith's Wood",
      "Kingshurst",
      "Fordbridge",
      "Bickenhill",
      "Elmdon",
      "Knowle",
      "Dorridge",
      "Hampton-in-Arden",
      "Hollywood",
      "Wythall",
      "Barnt Green",
      "Alvechurch",
      "Cofton Hackett",
      "Bromsgrove",
      "Smethwick",
      "Bearwood",
      "Oldbury",
      "West Bromwich",
      "Rowley Regis",
      "Halesowen",
      "Walsall",
      "Aldridge",
    ),
  },
];

export type CoveragePlace = {
  label: string;
  note?: string;
  slug: string;
  zoneId: string;
};

export function coverageSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function birminghamCoverageZoneById(id: string) {
  return BIRMINGHAM_COVERAGE_ZONES.find((zone) => zone.id === id) ?? null;
}

/** Out-of-city coverage. A group of real towns, not a place of its own. */
export const BIRMINGHAM_NEARBY_ZONE_ID = "border";

export function birminghamTownZones() {
  return BIRMINGHAM_COVERAGE_ZONES.filter(
    (zone) => zone.id !== BIRMINGHAM_NEARBY_ZONE_ID,
  );
}

export function birminghamNearbyZone() {
  return birminghamCoverageZoneById(BIRMINGHAM_NEARBY_ZONE_ID);
}

export function coveragePlaceSlug(name: string) {
  const known = BIRMINGHAM_AREAS.find(
    (area) => area.name.toLowerCase() === name.toLowerCase(),
  );
  return known?.slug ?? coverageSlug(name);
}

export function coverageAreaSlug(area: CoverageArea) {
  return area.slug ?? coveragePlaceSlug(area.label);
}

export type CoverageLinkFocus = {
  category?: "commercial" | "recovery" | "residential";
  serviceSlug?: string;
};

export function coverageFocusSearch(focus?: CoverageLinkFocus) {
  if (focus?.serviceSlug) return `?service=${encodeURIComponent(focus.serviceSlug)}`;
  if (focus?.category) return `?category=${focus.category}`;
  return "";
}

export function coverageAreaHref(area: CoverageArea, focus?: CoverageLinkFocus) {
  return `/cleaners/${LAUNCH_CITY.slug}/${coverageAreaSlug(area)}${coverageFocusSearch(focus)}`;
}

export function coveragePlaceHref(
  place: Pick<CoveragePlace, "slug">,
  focus?: CoverageLinkFocus,
) {
  return `/cleaners/${LAUNCH_CITY.slug}/${place.slug}${coverageFocusSearch(focus)}`;
}

export function coverageZoneHref(zoneId: string, focus?: CoverageLinkFocus) {
  return `/cleaners/${LAUNCH_CITY.slug}/wider/${zoneId}${coverageFocusSearch(focus)}`;
}

/** Unique places. The same slug keeps the first town’s page. */
export function birminghamCoveragePlaces(): CoveragePlace[] {
  const seen = new Set<string>();
  const places: CoveragePlace[] = [];
  for (const zone of BIRMINGHAM_COVERAGE_ZONES) {
    for (const area of zone.areas) {
      const slug = coverageAreaSlug(area);
      if (seen.has(slug)) continue;
      seen.add(slug);
      places.push({
        label: area.label,
        note: area.note,
        slug,
        zoneId: zone.id,
      });
    }
  }
  return places;
}

export function birminghamCoveragePlaceBySlug(slug: string) {
  return birminghamCoveragePlaces().find((place) => place.slug === slug) ?? null;
}
