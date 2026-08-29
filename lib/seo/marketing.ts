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
  name: string;
  slug: string;
};

function toSlug(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const MARKETING_SERVICES: MarketingService[] = SERVICES.map((service) => {
  const category = SERVICE_CATEGORIES.find(
    (item) => item.value === service.category,
  )!;
  const slug = toSlug(service.label);
  return {
    bookingHref: `/booking/new?service=${service.value}`,
    category: service.category,
    categoryLabel: category.label,
    description: service.description,
    fromPrice: formatMoney(service.basePrice),
    intro: `${service.label} with CleanScape — clear pricing, vetted cleaners and live booking status across Birmingham and supported UK areas.`,
    label: service.label,
    seoDescription: `${service.description} Book ${service.label.toLowerCase()} online with CleanScape. From ${formatMoney(service.basePrice)}.`,
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
    "Book trusted cleaners in Birmingham with CleanScape. Regular, deep, end-of-tenancy, Airbnb and office cleaning with clear pricing and live status.",
  slug: "birmingham",
  summary:
    "CleanScape’s launch focus is Birmingham and nearby neighbourhoods where we can fulfil reliably — starting with central and south-west clusters.",
} as const;

export const BIRMINGHAM_AREAS: MarketingArea[] = [
  {
    description:
      "City-centre apartments, professionals and short-let properties with high demand for reliable turnovers.",
    name: "Jewellery Quarter",
    slug: "jewellery-quarter",
  },
  {
    description:
      "Family homes and student areas needing regular upkeep, deep cleans and flexible one-off visits.",
    name: "Edgbaston",
    slug: "edgbaston",
  },
  {
    description:
      "Residential streets with strong demand for recurring cleans and end-of-tenancy handovers.",
    name: "Harborne",
    slug: "harborne",
  },
  {
    description:
      "Independent homes and rentals that benefit from checklist-led cleans and clear booking status.",
    name: "Moseley",
    slug: "moseley",
  },
  {
    description:
      "Busy households and landlords looking for dependable deep and move-related cleaning.",
    name: "Kings Heath",
    slug: "kings-heath",
  },
  {
    description:
      "Student and residential demand for regular, one-off and end-of-tenancy cleaning.",
    name: "Selly Oak",
    slug: "selly-oak",
  },
];

export function birminghamAreaBySlug(slug: string) {
  return BIRMINGHAM_AREAS.find((area) => area.slug === slug) ?? null;
}

export const MARKETING_FAQS: Array<{ answer: string; question: string }> = [
  {
    answer:
      "Enter your postcode in the booking flow, choose a service and cleaning standard, see your estimate, pick a time and pay securely. CleanScape then matches a suitable cleaner.",
    question: "How does booking with CleanScape work?",
  },
  {
    answer:
      "CleanScape is launching with a Birmingham-first footprint, including neighbourhoods such as Edgbaston, Harborne, Moseley, Kings Heath, Selly Oak and the Jewellery Quarter. Coverage expands as cleaner supply is ready.",
    question: "Where is CleanScape available?",
  },
  {
    answer:
      "Your estimate is based on the service, cleaning standard, property size and any add-ons. You see the price before checkout — no surprise fees after you book.",
    question: "How is pricing calculated?",
  },
  {
    answer:
      "Payment is taken securely through Stripe. For most bookings, CleanScape authorises or collects payment through the platform — you never pay the cleaner directly.",
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
    question: "Can I become a CleanScape cleaner?",
  },
  {
    answer:
      "Contact support@cleanscapeuk.com. For an active booking, use in-app messaging or your booking page so the right team can help quickly.",
    question: "How do I contact support?",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    body: "Choose residential, commercial, short-let, windows or recovery support — then the specific service you need.",
    title: "Pick your service",
  },
  {
    body: "Tell us about bedrooms, bathrooms and condition. CleanScape recommends the right standard and shows cleaner-time guidance.",
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
    "window_cleaning",
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
