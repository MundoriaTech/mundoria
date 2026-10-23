import {
  SERVICE_CATEGORIES,
  SERVICES,
  formatHourlyRate,
  indicativeHourlyRatePence,
  servicesForCategory,
} from "@/lib/customer/services";
import type { ServiceCategory, ServiceType } from "@/types/customer";

export type MarketingService = {
  bookingHref: string;
  category: ServiceCategory;
  categoryLabel: string;
  description: string;
  fromPrice: string;
  intro: string;
  label: string;
  seoDescription: string;
  slug: string;
  value: ServiceType;
};

export type MarketingArea = {
  description: string;
  faqs: Array<{ answer: string; question: string }>;
  highlights: string[];
  name: string;
  seoIntro: string;
  slug: string;
};

function toSlug(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Stable unique marketing slugs when labels would collide. */
const SERVICE_SLUG_OVERRIDES: Partial<Record<ServiceType, string>> = {
  airbnb_turnover: "airbnb-shortlet-cleaning",
  holiday_let: "holiday-let-cleaning",
};

export const MARKETING_SERVICES: MarketingService[] = SERVICES.map((service) => {
  const category = SERVICE_CATEGORIES.find(
    (item) => item.value === service.category,
  )!;
  const slug =
    SERVICE_SLUG_OVERRIDES[service.value] ?? toSlug(service.label);
  return {
    bookingHref: `/booking/new?service=${service.value}`,
    category: service.category,
    categoryLabel: category.label,
    description: service.description,
    fromPrice: formatHourlyRate(indicativeHourlyRatePence(service.value)),
    intro: `${service.label} with Mundoria — clear pricing, vetted cleaners and live booking status across Birmingham and supported UK areas.`,
    label: service.label,
    seoDescription: `${service.description} Book ${service.label.toLowerCase()} online with Mundoria. From ${formatHourlyRate(indicativeHourlyRatePence(service.value))}.`,
    slug,
    value: service.value,
  };
});

export function marketingServiceBySlug(slug: string) {
  return MARKETING_SERVICES.find((service) => service.slug === slug) ?? null;
}

export function isPublicMarketingService(service: MarketingService) {
  return SERVICES.find((item) => item.value === service.value)?.hidden !== true;
}

/** Services customers can book. Hidden catalogue leftovers stay off location URLs. */
export function publicMarketingServices() {
  return MARKETING_SERVICES.filter(isPublicMarketingService);
}

/** `/cleaning/{service}/birmingham` or `/cleaning/{service}/birmingham/{area}`. */
export function servicePlacePath(serviceSlug: string, areaSlug?: string) {
  const city = `/cleaning/${serviceSlug}/${LAUNCH_CITY.slug}`;
  return areaSlug ? `${city}/${areaSlug}` : city;
}

/** `/cleaning/{service}/birmingham/wider/{zone}`. */
export function servicePlaceZonePath(serviceSlug: string, zoneId: string) {
  return `${servicePlacePath(serviceSlug)}/wider/${zoneId}`;
}

export type ServiceCardLocation =
  | { kind: "city" }
  | { kind: "zone"; id: string }
  | { kind: "place"; slug: string };

export function serviceCardHref(
  serviceSlug: string,
  location?: ServiceCardLocation,
) {
  if (!location || location.kind === "city") return servicePlacePath(serviceSlug);
  if (location.kind === "zone") return servicePlaceZonePath(serviceSlug, location.id);
  return servicePlacePath(serviceSlug, location.slug);
}

export function servicePlaceFaqs(service: MarketingService, place: string) {
  return [
    {
      answer: `${service.label} in ${place} starts from ${service.fromPrice}. The price you pay depends on property size, cleaning standard, schedule and any add-ons. Mundoria shows the estimate before you pay.`,
      question: `How much does ${service.label.toLowerCase()} cost in ${place}?`,
    },
    {
      answer: `Choose ${service.label}, enter your address in ${place}, pick a date and time, and pay securely. Mundoria matches a vetted cleaner and keeps the visit status up to date until the clean is finished.`,
      question: `How do I book ${service.label.toLowerCase()} in ${place}?`,
    },
    {
      answer: service.description,
      question: `What does ${service.label.toLowerCase()} cover in ${place}?`,
    },
    {
      answer: `${service.label} is available across Birmingham, including the Jewellery Quarter, Edgbaston, Harborne, Moseley, Kings Heath and Selly Oak, when a cleaner covers that address.`,
      question: `Where in Birmingham can I book ${service.label.toLowerCase()}?`,
    },
  ];
}

export function marketingServicesByCategory(category: ServiceCategory) {
  return MARKETING_SERVICES.filter((service) => service.category === category);
}

export const LAUNCH_CITY = {
  name: "Birmingham",
  seoDescription:
    "Book trusted cleaners in Birmingham with Mundoria. Regular, deep, end-of-tenancy, Airbnb and office cleaning with clear pricing and live status.",
  slug: "birmingham",
  summary:
    "Mundoria covers Birmingham and the nearby towns listed on our location pages — cleaners choose a home district from the same live postcode list.",
} as const;

export const BIRMINGHAM_AREAS: MarketingArea[] = [
  {
    description:
      "City-centre apartments, professionals and short-let properties with high demand for reliable turnovers.",
    faqs: [
      {
        answer:
          "Yes. Jewellery Quarter flats and short-lets are a core Mundoria focus — regular cleans, guest turnovers and one-off deep cleans with clear estimates.",
        question: "Can Mundoria clean apartments in the Jewellery Quarter?",
      },
      {
        answer:
          "Same-day and next-day options appear when cleaner supply allows. Book early for weekend turnovers around city-centre check-outs.",
        question: "How quickly can I book a city-centre cleaner?",
      },
    ],
    highlights: [
      "Apartment and loft cleans suited to converted warehouse living",
      "Short-let turnovers timed around guest check-out windows",
      "Quiet weekday slots for professionals working from home",
    ],
    name: "Jewellery Quarter",
    seoIntro:
      "Trusted cleaners for Jewellery Quarter apartments, lofts and short-lets — clear pricing before you book, live status through arrival and completion.",
    slug: "jewellery-quarter",
  },
  {
    description:
      "Family homes and student areas needing regular upkeep, deep cleans and flexible one-off visits.",
    faqs: [
      {
        answer:
          "Yes. Edgbaston bookings commonly cover family homes, HMOs and nearby student houses with regular, deep and end-of-tenancy options.",
        question: "Does Mundoria cover family homes in Edgbaston?",
      },
      {
        answer:
          "Share pet notes in the booking. Cleaners follow your preferences for closed doors, product sensitivity and which rooms to prioritise.",
        question: "Can I book with pets in the home?",
      },
    ],
    highlights: [
      "Family homes and larger Victorian properties",
      "Flexible one-off cleans around university term dates",
      "Deep cleans before guests or after busy weeks",
    ],
    name: "Edgbaston",
    seoIntro:
      "Book Mundoria cleaners in Edgbaston for family homes and nearby student streets — recommended duration, transparent price and vetted pros.",
    slug: "edgbaston",
  },
  {
    description:
      "Residential streets with strong demand for recurring cleans and end-of-tenancy handovers.",
    faqs: [
      {
        answer:
          "Weekly, fortnightly and monthly options are available where supply allows. You can also customise dates after choosing frequency.",
        question: "Can I set a recurring clean in Harborne?",
      },
      {
        answer:
          "Yes. End-of-tenancy and move-out cleans are popular in Harborne for landlords and agents who need checklist-led handovers.",
        question: "Do you offer end-of-tenancy cleaning in Harborne?",
      },
    ],
    highlights: [
      "Recurring cleans for busy Harborne households",
      "Landlord-ready end-of-tenancy standards",
      "Add-ons like oven or fridge cleans when needed",
    ],
    name: "Harborne",
    seoIntro:
      "Harborne house cleaning with Mundoria — recurring visits, move cleans and deep cleans with a clear estimate and live booking updates.",
    slug: "harborne",
  },
  {
    description:
      "Independent homes and rentals that benefit from checklist-led cleans and clear booking status.",
    faqs: [
      {
        answer:
          "Yes. Moseley bookings suit independent homes, rentals and hosts who want checklist-led presentation without agency mark-ups.",
        question: "Is Mundoria available for Moseley rentals?",
      },
      {
        answer:
          "Choose Enhanced or Comprehensive standards for a deeper finish, or add oven, fridge and interior windows as optional extras.",
        question: "What if my Moseley home needs a deeper clean?",
      },
    ],
    highlights: [
      "Independent homes and character properties",
      "Checklist-led cleans with transparent status",
      "Host-friendly turnovers for local short-lets",
    ],
    name: "Moseley",
    seoIntro:
      "Find Mundoria cleaners in Moseley for homes and rentals — book online, see the price first, and track your visit from match to finish.",
    slug: "moseley",
  },
  {
    description:
      "Busy households and landlords looking for dependable deep and move-related cleaning.",
    faqs: [
      {
        answer:
          "Yes. Kings Heath landlords and agents use Mundoria for end-of-tenancy, move-in and deep cleans with clear before-you-book pricing.",
        question: "Can landlords book Mundoria in Kings Heath?",
      },
      {
        answer:
          "You manage eligible changes in your account. Fee windows are shown before you confirm — typically free more than 48 hours ahead.",
        question: "How do cancellations work for Kings Heath bookings?",
      },
    ],
    highlights: [
      "Deep cleans for busy family homes",
      "Move-in and move-out support for landlords",
      "Reliable weekday and weekend fulfilment paths",
    ],
    name: "Kings Heath",
    seoIntro:
      "Kings Heath cleaning with Mundoria — deep cleans, moving home support and regular visits with vetted cleaners and live status.",
    slug: "kings-heath",
  },
  {
    description:
      "Student and residential demand for regular, one-off and end-of-tenancy cleaning.",
    faqs: [
      {
        answer:
          "Yes. Selly Oak is a priority area for student houses, HMOs and end-of-tenancy handovers around term dates.",
        question: "Does Mundoria clean student houses in Selly Oak?",
      },
      {
        answer:
          "Book early near end of term. You’ll see available slots in the flow, with duration sized to bedrooms and bathrooms.",
        question: "When should I book an end-of-tenancy clean in Selly Oak?",
      },
    ],
    highlights: [
      "Student houses and HMO-friendly cleans",
      "End-of-tenancy demand around term changeovers",
      "One-off resets after parties or exams",
    ],
    name: "Selly Oak",
    seoIntro:
      "Book Mundoria cleaners in Selly Oak for student houses and residential streets — clear estimates, vetted pros and live booking status.",
    slug: "selly-oak",
  },
];

export function birminghamAreaBySlug(slug: string) {
  return BIRMINGHAM_AREAS.find((area) => area.slug === slug) ?? null;
}

/**
 * Live postcode districts for matching, cleaner home base, and district SEO pages.
 * Kept in sync with `BIRMINGHAM_COVERAGE_ZONES` (city + nearby towns on location pages).
 */
export type BirminghamPostcodeDistrict = {
  areaSlug: string;
  name: string;
  prefix: string;
  zoneId:
    | "central"
    | "west"
    | "south-west"
    | "south"
    | "north-west"
    | "north-east"
    | "east"
    | "south-east"
    | "sutton"
    | "border";
};

const BIRMINGHAM_POSTCODE_ZONE_ORDER: BirminghamPostcodeDistrict["zoneId"][] = [
  "central",
  "west",
  "south-west",
  "south",
  "north-west",
  "north-east",
  "east",
  "south-east",
  "sutton",
  "border",
];

/** Districts cleaners can choose and customers can be matched into. */
export const BIRMINGHAM_POSTCODES: readonly BirminghamPostcodeDistrict[] = [
  // Birmingham City Centre
  { areaSlug: "jewellery-quarter", name: "City Centre", prefix: "B1", zoneId: "central" },
  { areaSlug: "city-centre", name: "City Centre", prefix: "B2", zoneId: "central" },
  { areaSlug: "jewellery-quarter", name: "City Centre", prefix: "B3", zoneId: "central" },
  { areaSlug: "city-centre", name: "City Centre", prefix: "B4", zoneId: "central" },
  { areaSlug: "digbeth", name: "Digbeth & Highgate", prefix: "B5", zoneId: "central" },
  // Edgbaston & Harborne
  { areaSlug: "edgbaston", name: "Edgbaston", prefix: "B15", zoneId: "west" },
  { areaSlug: "edgbaston", name: "Edgbaston & Ladywood", prefix: "B16", zoneId: "west" },
  { areaSlug: "harborne", name: "Harborne", prefix: "B17", zoneId: "west" },
  { areaSlug: "winson-green", name: "Winson Green & Hockley", prefix: "B18", zoneId: "west" },
  { areaSlug: "quinton", name: "Quinton & Bartley Green", prefix: "B32", zoneId: "west" },
  // Selly Oak & Bournville
  { areaSlug: "selly-oak", name: "Selly Oak", prefix: "B29", zoneId: "south-west" },
  { areaSlug: "bournville", name: "Bournville & Stirchley", prefix: "B30", zoneId: "south-west" },
  { areaSlug: "northfield", name: "Northfield & Longbridge", prefix: "B31", zoneId: "south-west" },
  { areaSlug: "kings-norton", name: "Kings Norton", prefix: "B38", zoneId: "south-west" },
  { areaSlug: "rubery", name: "Rubery & Rednal", prefix: "B45", zoneId: "south-west" },
  // Moseley & Kings Heath
  { areaSlug: "sparkhill", name: "Sparkhill & Tyseley", prefix: "B11", zoneId: "south" },
  { areaSlug: "balsall-heath", name: "Balsall Heath & Sparkbrook", prefix: "B12", zoneId: "south" },
  { areaSlug: "moseley", name: "Moseley", prefix: "B13", zoneId: "south" },
  { areaSlug: "kings-heath", name: "Kings Heath", prefix: "B14", zoneId: "south" },
  { areaSlug: "acocks-green", name: "Acocks Green", prefix: "B27", zoneId: "south" },
  { areaSlug: "hall-green", name: "Hall Green", prefix: "B28", zoneId: "south" },
  // Aston & Handsworth
  { areaSlug: "aston", name: "Aston", prefix: "B6", zoneId: "north-west" },
  { areaSlug: "lozells", name: "Lozells & Newtown", prefix: "B19", zoneId: "north-west" },
  { areaSlug: "handsworth-wood", name: "Handsworth Wood", prefix: "B20", zoneId: "north-west" },
  { areaSlug: "handsworth", name: "Handsworth", prefix: "B21", zoneId: "north-west" },
  { areaSlug: "perry-barr", name: "Perry Barr & Great Barr", prefix: "B42", zoneId: "north-west" },
  { areaSlug: "kingstanding", name: "Kingstanding", prefix: "B44", zoneId: "north-west" },
  // Erdington
  { areaSlug: "erdington", name: "Erdington", prefix: "B23", zoneId: "north-east" },
  { areaSlug: "erdington", name: "Erdington & Tyburn", prefix: "B24", zoneId: "north-east" },
  { areaSlug: "castle-vale", name: "Castle Vale", prefix: "B35", zoneId: "north-east" },
  // Alum Rock & Hodge Hill
  { areaSlug: "nechells", name: "Nechells", prefix: "B7", zoneId: "east" },
  { areaSlug: "alum-rock", name: "Alum Rock & Saltley", prefix: "B8", zoneId: "east" },
  { areaSlug: "bordesley-green", name: "Bordesley Green", prefix: "B9", zoneId: "east" },
  { areaSlug: "small-heath", name: "Small Heath", prefix: "B10", zoneId: "east" },
  { areaSlug: "stechford", name: "Stechford & Kitts Green", prefix: "B33", zoneId: "east" },
  { areaSlug: "shard-end", name: "Shard End", prefix: "B34", zoneId: "east" },
  // Yardley & Sheldon
  { areaSlug: "yardley", name: "Yardley", prefix: "B25", zoneId: "south-east" },
  { areaSlug: "sheldon", name: "Sheldon & Yardley", prefix: "B26", zoneId: "south-east" },
  // Sutton Coldfield
  { areaSlug: "sutton-coldfield", name: "Sutton Coldfield", prefix: "B72", zoneId: "sutton" },
  { areaSlug: "boldmere", name: "Boldmere & New Oscott", prefix: "B73", zoneId: "sutton" },
  { areaSlug: "four-oaks", name: "Four Oaks & Mere Green", prefix: "B74", zoneId: "sutton" },
  { areaSlug: "sutton-coldfield", name: "Sutton Coldfield East", prefix: "B75", zoneId: "sutton" },
  { areaSlug: "walmley", name: "Walmley", prefix: "B76", zoneId: "sutton" },
  // Nearby towns (border SEO zone)
  { areaSlug: "castle-bromwich", name: "Castle Bromwich", prefix: "B36", zoneId: "border" },
  { areaSlug: "chelmsley-wood", name: "Chelmsley Wood", prefix: "B37", zoneId: "border" },
  { areaSlug: "bickenhill", name: "NEC & Airport", prefix: "B40", zoneId: "border" },
  { areaSlug: "great-barr", name: "Great Barr (border)", prefix: "B43", zoneId: "border" },
  { areaSlug: "coleshill", name: "Coleshill & Water Orton", prefix: "B46", zoneId: "border" },
  { areaSlug: "hollywood", name: "Hollywood & Wythall", prefix: "B47", zoneId: "border" },
  { areaSlug: "alvechurch", name: "Alvechurch", prefix: "B48", zoneId: "border" },
  { areaSlug: "halesowen", name: "Halesowen", prefix: "B62", zoneId: "border" },
  { areaSlug: "halesowen", name: "Halesowen South", prefix: "B63", zoneId: "border" },
  { areaSlug: "cradley-heath", name: "Cradley Heath", prefix: "B64", zoneId: "border" },
  { areaSlug: "rowley-regis", name: "Rowley Regis", prefix: "B65", zoneId: "border" },
  { areaSlug: "smethwick", name: "Smethwick & Bearwood", prefix: "B66", zoneId: "border" },
  { areaSlug: "smethwick", name: "Smethwick", prefix: "B67", zoneId: "border" },
  { areaSlug: "oldbury", name: "Oldbury", prefix: "B68", zoneId: "border" },
  { areaSlug: "oldbury", name: "Oldbury North", prefix: "B69", zoneId: "border" },
  { areaSlug: "west-bromwich", name: "West Bromwich", prefix: "B70", zoneId: "border" },
  { areaSlug: "west-bromwich", name: "West Bromwich North", prefix: "B71", zoneId: "border" },
  { areaSlug: "shirley", name: "Shirley", prefix: "B90", zoneId: "border" },
  { areaSlug: "solihull", name: "Solihull", prefix: "B91", zoneId: "border" },
  { areaSlug: "olton", name: "Olton & Solihull", prefix: "B92", zoneId: "border" },
  { areaSlug: "knowle", name: "Knowle & Dorridge", prefix: "B93", zoneId: "border" },
  { areaSlug: "solihull", name: "Solihull South", prefix: "B94", zoneId: "border" },
];

export function birminghamPostcode(prefix: string) {
  return (
    BIRMINGHAM_POSTCODES.find(
      (item) => item.prefix.toLowerCase() === prefix.toLowerCase(),
    ) ?? null
  );
}

/** Home-base / coverage picker order: SEO zone, then district number. */
export function birminghamPostcodesForPicker() {
  return [...BIRMINGHAM_POSTCODES].sort((a, b) => {
    const zoneDiff =
      BIRMINGHAM_POSTCODE_ZONE_ORDER.indexOf(a.zoneId) -
      BIRMINGHAM_POSTCODE_ZONE_ORDER.indexOf(b.zoneId);
    if (zoneDiff !== 0) return zoneDiff;
    return a.prefix.localeCompare(b.prefix, undefined, { numeric: true });
  });
}

/** `/cleaners/birmingham/harborne-b17` — place name in the path, postcode at the end. */
export function postcodePath(prefix: string) {
  const district = birminghamPostcode(prefix);
  const slug = district
    ? `${district.areaSlug}-${district.prefix.toLowerCase()}`
    : prefix.toLowerCase();
  return `/cleaners/${LAUNCH_CITY.slug}/${slug}`;
}

/** `harborne-b17` or a legacy bare `b17`. */
export function districtFromAreaParam(param: string) {
  const bare = birminghamPostcode(param);
  if (bare) return { district: bare, legacy: true as const };

  const match = param.match(/^(.+)-(b\d+[a-z]?)$/i);
  if (!match) return null;
  const district = birminghamPostcode(match[2] ?? "");
  const slug = (match[1] ?? "").toLowerCase();
  if (!district || district.areaSlug !== slug) return null;
  return { district, legacy: false as const };
}

export function districtLinkLabel(prefix: string) {
  const district = birminghamPostcode(prefix);
  if (!district) return prefix.toUpperCase();
  return `${district.name}, ${district.prefix}`;
}

export function prefixesForArea(areaSlug: string) {
  return BIRMINGHAM_POSTCODES.filter((item) => item.areaSlug === areaSlug).map(
    (item) => item.prefix,
  );
}

export const MARKETING_CATEGORY_PATHS = [
  "/cleaning/residential",
  "/cleaning/moving-home",
  "/cleaning/short-lets",
  "/cleaning/commercial",
  "/cleaning/recovery",
] as const;

export const FOR_CLEANERS_FAQS: Array<{ answer: string; question: string }> = [
  {
    answer:
      "Create a cleaner account, complete the onboarding wizard, upload your documents, connect Stripe Express for payouts, then wait for admin review before jobs appear in your feed.",
    question: "How do I become a Mundoria cleaner?",
  },
  {
    answer:
      "Photo ID (passport or driving licence), a clear DBS check, a profile headshot, and right-to-work evidence if you are not a British or Irish national. Independent cleaners should be registered as self-employed with HMRC — Mundoria may ask for your UTR before you accept paid jobs.",
    question: "What documents do I need?",
  },
  {
    answer:
      "No. Mundoria cleaners are independent contractors, not employees. You choose the jobs you take, set your availability and working areas, and manage your own tax status with HMRC.",
    question: "Am I an employee of Mundoria?",
  },
  {
    answer:
      "Mundoria is launching with a Birmingham-first footprint. You set the neighbourhoods you want to work in, and eligible jobs in those areas appear in your feed.",
    question: "Where can I take jobs?",
  },
  {
    answer:
      "Eligible jobs appear in your feed for your working areas. Accept work that fits your schedule and keep a clear calendar — there is no private off-platform negotiation.",
    question: "Can I choose which jobs I accept?",
  },
  {
    answer:
      "Connect Stripe Express, choose a weekly or monthly payout preference and track earnings in your cleaner dashboard. Payouts are handled through Stripe Connect after jobs are completed.",
    question: "How do payouts work?",
  },
  {
    answer:
      "After you create a cleaner account and finish onboarding, an admin reviews your profile. Once approved, matching jobs start appearing in your cleaner feed.",
    question: "What happens after I apply?",
  },
  {
    answer:
      "Visit the Become a Mundoria cleaner Help Centre, or use Contact us on the site to chat with the Mundoria team. For an active job, use in-app messaging so the right people see the full context.",
    question: "How do I get support as a cleaner?",
  },
];

export const MARKETING_FAQS: Array<{ answer: string; question: string }> = [
  {
    answer:
      "Enter your postcode in the booking flow, choose a service and cleaning standard, see your estimate, pick a time and pay securely. Mundoria then matches a suitable cleaner.",
    question: "How does booking with Mundoria work?",
  },
  {
    answer:
      "Mundoria is launching with a Birmingham-first footprint, including neighbourhoods such as Edgbaston, Harborne, Moseley, Kings Heath, Selly Oak and the Jewellery Quarter. Coverage expands as cleaner supply is ready.",
    question: "Where is Mundoria available?",
  },
  {
    answer:
      "Your estimate is based on the service, cleaning standard, property size and any add-ons. You see the price before checkout — no surprise fees after you book.",
    question: "How is pricing calculated?",
  },
  {
    answer:
      "Payment is taken securely through Stripe. For most bookings, Mundoria authorises or collects payment through the platform — you never pay the cleaner directly.",
    question: "When do I pay?",
  },
  {
    answer:
      "Yes. Cleaners complete onboarding, identity checks and document review before receiving jobs. Admin can verify DBS and identity documents as part of approval.",
    question: "Are cleaners vetted?",
  },
  {
    answer:
      "You can manage eligible bookings in your account, including cancellation where still allowed. Any fee consequences are shown before you confirm a change.",
    question: "Can I cancel or reschedule?",
  },
  {
    answer:
      "Yes. Independent cleaners can apply, complete onboarding, set availability and working areas, then accept jobs and receive payouts through Stripe Connect.",
    question: "Can I become a Mundoria cleaner?",
  },
  {
    answer:
      "Start with the FAQ for booking, payments and cancellations. Visit the Help Centre for longer guides, or use Contact us on the site to open chat with the Mundoria team. For an active booking, use in-app messaging so the right people see the full context.",
    question: "How do I contact support?",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    body: "Choose residential, moving home, short-let, commercial or recovery support — then the specific service you need.",
    title: "Pick your service",
  },
  {
    body: "Tell us about bedrooms, bathrooms and condition. Mundoria recommends the right standard and shows cleaner-time guidance.",
    title: "Get a clear estimate",
  },
  {
    body: "Choose a date and time with a realistic fulfilment path, then confirm and pay securely.",
    title: "Book and pay",
  },
  {
    body: "Track matching, arrival and completion. Confirm the checklist and rate when the job is done.",
    title: "Follow every step",
  },
] as const;

export function popularMarketingServices(limit = 6) {
  const preferred: ServiceType[] = [
    "regular",
    "deep_clean",
    "end_of_tenancy",
    "airbnb_turnover",
    "office",
    "move_in",
  ];
  return preferred
    .map((value) => MARKETING_SERVICES.find((service) => service.value === value))
    .filter((service): service is MarketingService => Boolean(service))
    .slice(0, limit);
}

export function categoryMarketingLinks() {
  return SERVICE_CATEGORIES.map((category) => ({
    description: category.description,
    href: `/cleaning?category=${category.value}`,
    label: category.label,
    services: servicesForCategory(category.value).map((service) => {
      const marketing = MARKETING_SERVICES.find((item) => item.value === service.value)!;
      return {
        href: `/cleaning/${marketing.slug}`,
        label: marketing.label,
      };
    }),
  }));
}
