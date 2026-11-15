/**
 * Public marketing URL map (no `/cleaning` prefix).
 *
 * Pattern:
 *   /{category}
 *   /{category}/{service}                    (when the category has subtypes)
 *   /{category}/birmingham
 *   /{category}/birmingham/{area}
 *   /{category}/{service}/birmingham
 *   /{category}/{service}/birmingham/{area}
 *   /{category}/{town}                       (standalone towns, house default)
 *
 * Cleaner profiles stay under `/cleaners/...`.
 */

import type { ServiceCategory, ServiceType } from "@/types/customer";

/** Launch city slug — keep local to avoid import cycles with marketing.ts. */
const LAUNCH_CITY_SLUG = "birmingham";

/**
 * Standalone town pages (not under /birmingham/).
 * These places are outside Birmingham city but were previously nested there.
 * Kept here (not in canonical.ts) to avoid an import cycle with path helpers.
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
  "worcester",
  "alvechurch",
  "barnt-green",
  "marston-green",
  "chelmsley-wood",
  "castle-bromwich",
  "bearwood",
]);

/** Root path segment for each bookable category. */
export const CATEGORY_ROOT: Record<
  Exclude<ServiceCategory, "exterior">,
  string
> = {
  residential: "house-cleaning",
  commercial: "workspace-cleaning",
  short_term_rental: "airbnb-cleaning",
  moving_home: "moving-cleaning",
  recovery: "recovery-cleaning",
};

/** Short service segment under its category root. */
export const SERVICE_SEGMENT: Partial<Record<ServiceType, string>> = {
  regular: "regular",
  one_off: "one-off",
  deep_clean: "deep",
  move_in: "move-in-move-out",
  move_out: "move-in-move-out",
  end_of_tenancy: "end-of-tenancy",
  airbnb_turnover: "shortlet",
  holiday_let: "shortlet",
  serviced_accommodation: "serviced",
  office: "office",
  retail_hospitality: "retail-and-hospitality",
  educational_facility: "education",
  communal_area: "communal-areas",
  pregnancy_support: "pregnancy-and-postpartum",
  postpartum: "pregnancy-and-postpartum",
  hospital_discharge: "hospital-discharge",
  bereavement_support: "bereavement-support",
};

/** Legacy marketing slug (under `/cleaning/`) → new public path. */
export const LEGACY_CLEANING_PATHS: Record<string, string> = {
  residential: "/house-cleaning",
  commercial: "/workspace-cleaning",
  "short-lets": "/airbnb-cleaning",
  "moving-home": "/moving-cleaning",
  recovery: "/recovery-cleaning",
  "regular-cleaning": "/house-cleaning/regular",
  "one-off-cleaning": "/house-cleaning/one-off",
  "deep-cleaning": "/house-cleaning/deep",
  "same-day-cleaning": "/house-cleaning/one-off",
  "move-in-move-out-cleaning": "/moving-cleaning/move-in-move-out",
  "move-out-cleaning": "/moving-cleaning/move-in-move-out",
  "end-of-tenancy-cleaning": "/moving-cleaning/end-of-tenancy",
  "airbnb-shortlet-cleaning": "/airbnb-cleaning/shortlet",
  "holiday-let-cleaning": "/airbnb-cleaning/shortlet",
  "serviced-accommodation-cleaning": "/airbnb-cleaning/serviced",
  "office-cleaning": "/workspace-cleaning/office",
  "retail-and-hospitality-cleaning": "/workspace-cleaning/retail-and-hospitality",
  "educational-facility-cleaning": "/workspace-cleaning/education",
  "communal-area-cleaning": "/workspace-cleaning/communal-areas",
  "pregnancy-and-postpartum-cleaning":
    "/recovery-cleaning/pregnancy-and-postpartum",
  "postpartum-cleaning": "/recovery-cleaning/pregnancy-and-postpartum",
  "hospital-discharge-home-cleaning": "/recovery-cleaning/hospital-discharge",
  "bereavement-support-cleaning": "/recovery-cleaning/bereavement-support",
  "illness-and-injury-recovery": "/recovery-cleaning",
  "injury-recovery-cleaning": "/recovery-cleaning",
};

const ROOT_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_ROOT).map(([category, root]) => [root, category]),
) as Record<string, ServiceCategory>;

const SEGMENT_TO_SERVICE = Object.entries(SERVICE_SEGMENT).reduce(
  (acc, [service, segment]) => {
    if (!acc[segment]) acc[segment] = service as ServiceType;
    return acc;
  },
  {} as Record<string, ServiceType>,
);

export function isCategoryRoot(segment: string): boolean {
  return segment in ROOT_TO_CATEGORY;
}

export function categoryFromRoot(
  root: string,
): Exclude<ServiceCategory, "exterior"> | null {
  const value = ROOT_TO_CATEGORY[root];
  if (!value || value === "exterior") return null;
  return value as Exclude<ServiceCategory, "exterior">;
}

export function categoryRootPath(
  category: Exclude<ServiceCategory, "exterior">,
): string {
  return `/${CATEGORY_ROOT[category]}`;
}

export function servicePublicPath(
  category: Exclude<ServiceCategory, "exterior">,
  serviceType: ServiceType,
): string {
  const segment = SERVICE_SEGMENT[serviceType];
  if (!segment) return categoryRootPath(category);
  return `${categoryRootPath(category)}/${segment}`;
}

export function categoryCityPath(
  category: Exclude<ServiceCategory, "exterior">,
  citySlug = LAUNCH_CITY_SLUG,
): string {
  return `${categoryRootPath(category)}/${citySlug}`;
}

export function categoryPlacePath(
  category: Exclude<ServiceCategory, "exterior">,
  placeSlug: string,
  citySlug = LAUNCH_CITY_SLUG,
): string {
  // House cleaning city hub lives at the category root (no /birmingham twin).
  if (category === "residential" && placeSlug === citySlug) {
    return categoryRootPath(category);
  }
  if (STANDALONE_TOWN_SLUGS.has(placeSlug) || placeSlug === citySlug) {
    return `${categoryRootPath(category)}/${placeSlug}`;
  }
  return `${categoryRootPath(category)}/${citySlug}/${placeSlug}`;
}

export function serviceCityPath(
  category: Exclude<ServiceCategory, "exterior">,
  serviceType: ServiceType,
  citySlug = LAUNCH_CITY_SLUG,
): string {
  return `${servicePublicPath(category, serviceType)}/${citySlug}`;
}

export function servicePlacePath(
  category: Exclude<ServiceCategory, "exterior">,
  serviceType: ServiceType,
  placeSlug: string,
  citySlug = LAUNCH_CITY_SLUG,
): string {
  if (placeSlug === citySlug) {
    return serviceCityPath(category, serviceType, citySlug);
  }
  if (STANDALONE_TOWN_SLUGS.has(placeSlug)) {
    return `${servicePublicPath(category, serviceType)}/${placeSlug}`;
  }
  return `${servicePublicPath(category, serviceType)}/${citySlug}/${placeSlug}`;
}

/**
 * House-cleaning city hub — same as the category root.
 * `/house-cleaning/birmingham` redirects here; areas stay under `/house-cleaning/birmingham/{area}`.
 */
export function houseCleaningCityPath(): string {
  return categoryRootPath("residential");
}

export function houseCleaningPlacePath(placeSlug: string): string {
  return categoryPlacePath("residential", placeSlug);
}

export function legacyCleaningPathToPublic(path: string): string | null {
  const bare = path.split("?")[0] || path;
  if (!bare.startsWith("/cleaning")) return null;
  // Services catalogue index stays at /cleaning
  if (bare === "/cleaning" || bare === "/cleaning/") return "/cleaning";

  const parts = bare.split("/").filter(Boolean);
  // cleaning / {slug} / ...
  const slug = parts[1];
  if (!slug) return "/services";

  const mapped = LEGACY_CLEANING_PATHS[slug];
  if (!mapped) return null;

  // /cleaning/{slug}/birmingham → {mapped}/birmingham or category city
  if (parts[2] === LAUNCH_CITY_SLUG) {
    if (parts[3]) {
      // area or wider
      if (parts[3] === "wider") {
        const baseParts = mapped.split("/").filter(Boolean);
        return baseParts.length >= 2
          ? `/${baseParts[0]}/${baseParts[1]}/${LAUNCH_CITY_SLUG}`
          : `/${baseParts[0]}/${LAUNCH_CITY_SLUG}`;
      }
      // Prefer service+city+area when mapped is a service path
      const baseParts = mapped.split("/").filter(Boolean);
      if (baseParts.length >= 2) {
        return `/${baseParts[0]}/${baseParts[1]}/${LAUNCH_CITY_SLUG}/${parts[3]}`;
      }
      return `/${baseParts[0]}/${LAUNCH_CITY_SLUG}/${parts[3]}`;
    }
    const baseParts = mapped.split("/").filter(Boolean);
    if (baseParts.length >= 2) {
      return `/${baseParts[0]}/${baseParts[1]}/${LAUNCH_CITY_SLUG}`;
    }
    return `/${baseParts[0]}/${LAUNCH_CITY_SLUG}`;
  }

  if (parts[2] === "guides") {
    return mapped;
  }

  return mapped;
}

export type PublicPathParse = {
  category: Exclude<ServiceCategory, "exterior">;
  citySlug?: string;
  placeSlug?: string;
  serviceType?: ServiceType;
};

/**
 * Parse `/house-cleaning/...` style segments (no leading category root in array).
 * `segments` are after the category root.
 */
export function parseCategorySegments(
  category: Exclude<ServiceCategory, "exterior">,
  segments: string[],
): PublicPathParse | null {
  if (segments.length === 0) {
    return { category };
  }

  const [a, b, c] = segments;
  const serviceFromA = SEGMENT_TO_SERVICE[a!];

  // /{cat}/{service}
  if (segments.length === 1 && serviceFromA) {
    return { category, serviceType: serviceFromA };
  }

  // /{cat}/{city|town}
  if (segments.length === 1 && !serviceFromA) {
    if (a === LAUNCH_CITY_SLUG || STANDALONE_TOWN_SLUGS.has(a!)) {
      return { category, citySlug: a, placeSlug: a };
    }
    // Neighbourhood under the launch city.
    return { category, citySlug: LAUNCH_CITY_SLUG, placeSlug: a };
  }

  // /{cat}/{service}/{city}
  if (segments.length === 2 && serviceFromA) {
    return {
      category,
      serviceType: serviceFromA,
      citySlug: b,
      placeSlug: b === LAUNCH_CITY_SLUG ? undefined : b,
    };
  }

  // /{cat}/{city}/{area}
  if (segments.length === 2 && !serviceFromA && a === LAUNCH_CITY_SLUG) {
    return { category, citySlug: a, placeSlug: b };
  }

  // /{cat}/{service}/{city}/{area}
  if (segments.length === 3 && serviceFromA && b === LAUNCH_CITY_SLUG) {
    return {
      category,
      serviceType: serviceFromA,
      citySlug: b,
      placeSlug: c,
    };
  }

  // /{cat}/{service}/{town} (standalone)
  if (
    segments.length === 2 &&
    serviceFromA &&
    STANDALONE_TOWN_SLUGS.has(b!)
  ) {
    return {
      category,
      serviceType: serviceFromA,
      citySlug: b,
      placeSlug: b,
    };
  }

  return null;
}

export function serviceTypeFromSegment(
  segment: string,
): ServiceType | undefined {
  return SEGMENT_TO_SERVICE[segment];
}

export function allCategoryRoots(): string[] {
  return Object.values(CATEGORY_ROOT);
}

export function allServiceSegmentsFor(
  category: Exclude<ServiceCategory, "exterior">,
): string[] {
  const residential: ServiceType[] = ["regular", "one_off", "deep_clean"];
  const moving: ServiceType[] = ["move_in", "move_out", "end_of_tenancy"];
  const airbnb: ServiceType[] = [
    "airbnb_turnover",
    "holiday_let",
    "serviced_accommodation",
  ];
  const workspace: ServiceType[] = [
    "office",
    "retail_hospitality",
    "educational_facility",
    "communal_area",
  ];
  const recovery: ServiceType[] = [
    "pregnancy_support",
    "postpartum",
    "hospital_discharge",
    "bereavement_support",
  ];
  const map: Record<string, ServiceType[]> = {
    residential,
    moving_home: moving,
    short_term_rental: airbnb,
    commercial: workspace,
    recovery,
  };
  const allowed = new Set(map[category] ?? []);
  const segments = (
    Object.entries(SERVICE_SEGMENT) as [ServiceType, string][]
  )
    .filter(([type]) => allowed.has(type))
    .map(([, segment]) => segment);
  return Array.from(new Set(segments));
}
