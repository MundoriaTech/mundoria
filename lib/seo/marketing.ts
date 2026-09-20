import {
  SERVICE_CATEGORIES,
  SERVICES,
  formatMoney,
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
    fromPrice: formatMoney(service.basePrice),
    intro: `${service.label} with Mundoria — clear pricing, vetted cleaners and live booking status across Birmingham and supported UK areas.`,
    label: service.label,
    seoDescription: `${service.description} Book ${service.label.toLowerCase()} online with Mundoria. From ${formatMoney(service.basePrice)}.`,
    slug,
    value: service.value,
  };
});

export function marketingServiceBySlug(slug: string) {
  return MARKETING_SERVICES.find((service) => service.slug === slug) ?? null;
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
    "Mundoria’s launch focus is Birmingham and nearby neighbourhoods where we can fulfil reliably — starting with central and south-west clusters.",
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

export const MARKETING_CATEGORY_PATHS = [
  "/cleaning/residential",
  "/cleaning/moving-home",
  "/cleaning/short-lets",
  "/cleaning/commercial",
  "/cleaning/recovery",
] as const;

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
      "Use Contact us to open chat with the Mundoria team, or visit the Help Centre. For an active booking, use in-app messaging so the right people see the full context.",
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
