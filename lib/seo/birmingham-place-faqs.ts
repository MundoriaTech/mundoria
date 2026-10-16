import { placeServiceExplainerSchemaText } from "@/lib/seo/place-service-explainer";
import { servicePlacePath } from "@/lib/seo/marketing";

/** Plain-text FAQ answers for JSON-LD (matches on-page linked copy). */
export function birminghamPlaceFaqSchemaAnswers(place: string) {
  return birminghamPlaceFaqEntries(place).map((item) => ({
    question: item.question,
    answer: item.schemaAnswer,
  }));
}

export function whyChooseMundoriaPoints() {
  return [
    "Independent cleaners who complete Mundoria onboarding and document review before going live.",
    "Clear estimates sized to your property, service and add-ons before you pay.",
    "Secure online payment held until the job is completed to your checklist.",
    "Live status from matching through arrival and completion in your account.",
    "Flexible scheduling with free cancellation more than 48 hours before the visit.",
    "Residential, commercial, short-let, move and Recovery services in one booking flow.",
    "Add-ons such as oven, fridge, ironing and cleaning products when you need them.",
    "Customer support and help articles when you want guidance before you book.",
  ] as const;
}

export function houseCleanCoveredPoints() {
  return [
    "Hoovering and floor care for hard floors and carpets in agreed rooms",
    "Bathroom cleaning — sinks, toilets and visible fixtures; mirrors streak-free",
    "Kitchen surfaces, sink and hob wipe-down (oven deep-clean as an add-on)",
    "Dusting and surface wipe of reachable furniture and ledges",
    "Emptying bins and light tidy of clutter-free areas",
    "Bed linen change when requested and linen is left ready",
  ] as const;
}

export function houseCleanCoveredSchemaAnswer() {
  return `Exact scope depends on your service and cleaning standard. Typical residential visits include: ${houseCleanCoveredPoints().join(" ")}`;
}

export function bookCleanerSteps(place: string) {
  return [
    `Open Mundoria booking and enter your postcode in ${place}`,
    "Choose your service and cleaning standard",
    "Add property details, duration and any add-ons",
    "Pick a date and time that works for you",
    "Pay securely — we hold payment until the clean is done",
  ] as const;
}

export function bookCleanerSchemaAnswer(place: string) {
  return bookCleanerSteps(place)
    .map((step, index) => `${index + 1}. ${step}`)
    .join(" ");
}

export function whyChooseMundoriaSchemaAnswer(place: string) {
  const points = whyChooseMundoriaPoints()
    .map((point, index) => `${index + 1}. ${point}`)
    .join(" ");
  return `${points} Ready to try Mundoria? See cleaners in ${place}.`;
}

export type BirminghamPlaceFaqEntry = {
  question: string;
  schemaAnswer: string;
};

export function birminghamPlaceFaqEntries(place: string): BirminghamPlaceFaqEntry[] {
  return [
    {
      question: `What cleaning services does Mundoria offer in ${place}?`,
      schemaAnswer: placeServiceExplainerSchemaText(place),
    },
    {
      question: `What’s covered in a Mundoria house clean in ${place}?`,
      schemaAnswer: houseCleanCoveredSchemaAnswer(),
    },
    {
      question: `How do I book a cleaner in ${place}?`,
      schemaAnswer: bookCleanerSchemaAnswer(place),
    },
    {
      question: `Why choose Mundoria for domestic cleaning in ${place}?`,
      schemaAnswer: whyChooseMundoriaSchemaAnswer(place),
    },
    {
      question: "What can a cleaner do in 2 hours?",
      schemaAnswer:
        "In two hours a cleaner can usually refresh a kitchen (surfaces, sink, hob wipe), sanitise a bathroom, hoover and mop main floors, dust living areas, empty bins, and light-tidy clutter-free rooms. Declutter first and share priorities in the booking notes so time goes on cleaning, not organising.",
    },
    {
      question: "Are Mundoria cleaners vetted?",
      schemaAnswer:
        "Cleaners complete Mundoria onboarding, identity and document checks, and skills review before receiving jobs. Payment is handled securely through the platform rather than cash on the day.",
    },
    {
      question: `What do most cleaners charge per hour in ${place}?`,
      schemaAnswer:
        "Independent cleaners in Birmingham and the West Midlands often charge roughly £12–15 per hour, while company rates are commonly £16–20 per hour depending on location and scope. Mundoria shows a clear estimate for your home size and service before you confirm — not an open-ended hourly quote after the visit.",
    },
    {
      question: `How much does Mundoria cleaning cost in ${place}?`,
      schemaAnswer:
        "Price depends on service, property size, cleaning standard, schedule and add-ons. Mundoria displays the estimate at checkout so you know the cost before the clean starts.",
    },
    {
      question: `Can I book a deep cleaning service in ${place}?`,
      schemaAnswer: `Yes. Choose deep cleaning when you book or visit the deep cleaning Birmingham page. Add oven, fridge or interior windows if you want a heavier reset.`,
    },
    {
      question: "Do I need to provide cleaning supplies?",
      schemaAnswer:
        "You can use your own products or add cleaning products in booking when your cleaner can bring basics. Share fragrance-free or allergy notes in the booking instructions.",
    },
    {
      question: "What is the Mundoria cancellation policy?",
      schemaAnswer:
        "You can cancel or reschedule free of charge more than 48 hours before the visit. A partial fee may apply within 48 hours, and the full amount within 24 hours. Your booking confirmation shows the exact windows that apply.",
    },
  ];
}

export const BIRMINGHAM_SERVICE_FAQ_LINKS = {
  airbnb: servicePlacePath("airbnb-shortlet-cleaning"),
  deep: servicePlacePath("deep-cleaning"),
  eot: servicePlacePath("end-of-tenancy-cleaning"),
  regular: servicePlacePath("regular-cleaning"),
} as const;
