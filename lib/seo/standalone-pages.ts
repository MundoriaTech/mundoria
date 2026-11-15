/**
 * Root marketing pages outside the category hierarchy:
 * `/domestic-cleaning` and booking-flow extras (`/ironing`, `/fridge-cleaning`, …).
 */

import type { CategoryFaq } from "@/components/marketing/service-category/service-category-marketing-page";

export type StandalonePageKind = "domestic" | "extra";

export type StandalonePageDef = {
  /** Booking add-on id when this page maps to a selectable extra. */
  addOnId?: string;
  bookCta: string;
  bullets: [string, string, string];
  /** Image used on /cleaning cards and related carousels. */
  cardImage: string;
  description: string;
  faqs: CategoryFaq[];
  heroImage: string;
  kind: StandalonePageKind;
  /** Public path, e.g. `/ironing`. */
  path: string;
  /** Path segment without leading slash. */
  slug: string;
  subtitle: string;
  title: string;
  metaTitle: string;
};

const RESIDENTIAL_HERO = "/images/marketing/landing/residential-hero.jpg";
const RESIDENTIAL_REGULAR =
  "/images/marketing/landing/residential-regular.png";

const ICON = {
  fridge: "/images/marketing/icons/plain/inside-fridge.png",
  ironing: "/images/marketing/icons/plain/ironing.png",
  laundry: "/images/marketing/icons/plain/laundry.png",
  oven: "/images/marketing/icons/plain/inside-oven.png",
  windows: "/images/marketing/icons/plain/interior-windows.png",
} as const;

function faq(
  question: string,
  answer: string,
): CategoryFaq {
  return { question, answer };
}

export const STANDALONE_PAGES: StandalonePageDef[] = [
  {
    bookCta: "Book domestic cleaning",
    bullets: [
      "Clear estimates before you book",
      "One visit, or a regular schedule",
      "Reliable, vetted cleaners you can trust",
    ],
    cardImage: RESIDENTIAL_REGULAR,
    description:
      "Domestic cleaning in Birmingham for everyday homes — kitchens, living spaces and bathrooms kept tidy by vetted independent cleaners, with the price shown before you book.",
    faqs: [
      faq(
        "What is domestic cleaning?",
        "Domestic cleaning is home cleaning for everyday living spaces: kitchens, bathrooms, bedrooms and living areas. On Mundoria you can book it as a one-off visit or on a regular schedule.",
      ),
      faq(
        "How is domestic cleaning different from a deep clean?",
        "Domestic cleaning covers routine upkeep. A deep clean spends longer on neglected areas, behind appliances and places weekly visits usually skip. You can choose either when you book.",
      ),
      faq(
        "Can I add extras like ironing or oven cleaning?",
        "Yes. During booking you can add extras such as ironing, laundry, fridge cleaning, oven cleaning and inside windows. Time is added where needed so the visit stays realistic.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "domestic",
    metaTitle: "Domestic Cleaning in Birmingham | Mundoria",
    path: "/domestic-cleaning",
    slug: "domestic-cleaning",
    subtitle:
      "Reliable home cleaning for flats and houses, with a clear estimate before you confirm.",
    title: "Domestic Cleaning",
  },
  {
    addOnId: "ironing",
    bookCta: "Book with ironing",
    bullets: [
      "About 30 minutes added for ironing time",
      "No separate ironing charge — you pay for the visit time",
      "Add it when you book a home clean",
    ],
    cardImage: ICON.ironing,
    description:
      "Ironing as an add-on to your Mundoria home clean in Birmingham. We add time for pressing and folding so it fits the visit, with a clear estimate before you book.",
    faqs: [
      faq(
        "Is ironing a standalone service?",
        "Ironing is offered as an extra on a domestic / house cleaning visit. Select it in the booking extras step and we add time for the work.",
      ),
      faq(
        "Do I need to provide an ironing board?",
        "Yes — please have an ironing board available. If the cleaner is bringing equipment, they can bring an iron, but the board is not included.",
      ),
      faq(
        "How much does ironing cost?",
        "Ironing itself is not charged as a separate line. We add about 30 minutes to the booking (you can adjust) and you pay for that cleaning time at your service rate.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Ironing with Your Clean | Mundoria Birmingham",
    path: "/ironing",
    slug: "ironing",
    subtitle:
      "Add ironing to a home clean — pressing and folding during the visit.",
    title: "Ironing",
  },
  {
    addOnId: "laundry",
    bookCta: "Book with laundry",
    bullets: [
      "Wash, dry and fold during the visit",
      "About 30 minutes added at no separate laundry fee",
      "Machine and detergent need to be available",
    ],
    cardImage: ICON.laundry,
    description:
      "Laundry cleaning as a Mundoria booking extra in Birmingham: wash, dry and fold during your home clean, with time added so the visit stays on track.",
    faqs: [
      faq(
        "What does the laundry extra include?",
        "Wash, dry and fold during the visit. Please have detergent available and a usable machine. Laundry is not a separate charge — you pay for the added cleaning time.",
      ),
      faq(
        "How much time is added?",
        "We start with about 30 minutes and you can adjust depending on how much laundry you have.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Laundry Cleaning Add-On | Mundoria Birmingham",
    path: "/laundry-cleaning",
    slug: "laundry-cleaning",
    subtitle: "Wash, dry and fold as part of your home cleaning visit.",
    title: "Laundry Cleaning",
  },
  {
    addOnId: "inside_fridge",
    bookCta: "Book with fridge cleaning",
    bullets: [
      "Shelves, drawers and seals",
      "About 30 minutes added to the visit",
      "Empty perishables you do not want moved",
    ],
    cardImage: ICON.fridge,
    description:
      "Fridge cleaning in Birmingham as a Mundoria add-on: interior wipe-down of shelves, drawers and seals during your home clean.",
    faqs: [
      faq(
        "What is included in fridge cleaning?",
        "An interior clean of shelves, drawers and seals. Please empty perishables you do not want moved before the visit.",
      ),
      faq(
        "Is fridge cleaning charged separately?",
        "No separate fridge fee — we add about 30 minutes and you pay for that time at your service rate.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Fridge Cleaning in Birmingham | Mundoria",
    path: "/fridge-cleaning",
    slug: "fridge-cleaning",
    subtitle: "Interior fridge cleaning added to your home clean.",
    title: "Fridge Cleaning",
  },
  {
    addOnId: "inside_oven",
    bookCta: "Book with oven cleaning",
    bullets: [
      "Interior walls, racks and door glass",
      "About 30 minutes added to the visit",
      "Finish any self-cleaning cycle before we arrive",
    ],
    cardImage: ICON.oven,
    description:
      "Oven cleaning in Birmingham as a Mundoria booking extra: grease and residue cleaned from the oven interior during your visit.",
    faqs: [
      faq(
        "What does oven cleaning cover?",
        "Interior walls, racks and door glass. Self-cleaning cycles should be finished before the visit.",
      ),
      faq(
        "Is there a separate oven cleaning fee?",
        "Oven cleaning is not charged as its own line. We add about 30 minutes and you pay for the visit time.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Oven Cleaning in Birmingham | Mundoria",
    path: "/oven-cleaning",
    slug: "oven-cleaning",
    subtitle: "Interior oven cleaning as part of your Mundoria booking.",
    title: "Oven Cleaning",
  },
  {
    addOnId: "interior_windows",
    bookCta: "Book with window cleaning",
    bullets: [
      "Inside glass and accessible sills",
      "About 30 minutes added to the visit",
      "Interior only — not exterior or high atrium glass",
    ],
    cardImage: ICON.windows,
    description:
      "Window cleaning (interior) in Birmingham with Mundoria: inside glass and sills as an add-on to your home or commercial clean.",
    faqs: [
      faq(
        "Do you clean exterior windows?",
        "This extra covers interior glass and accessible sills only. It does not include exterior glazing or high atrium windows.",
      ),
      faq(
        "How is window cleaning priced?",
        "There is no separate window fee — we add about 30 minutes and you pay for that cleaning time.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Window Cleaning (Interior) Birmingham | Mundoria",
    path: "/window-cleaning",
    slug: "window-cleaning",
    subtitle: "Interior window glass and sill cleaning as a booking extra.",
    title: "Window Cleaning",
  },
  {
    addOnId: "inside_cabinets",
    bookCta: "Book with cabinet cleaning",
    bullets: [
      "Interior cupboard and cabinet wipe-down",
      "Popular for short-let turnovers",
      "Priced clearly in your estimate",
    ],
    cardImage: RESIDENTIAL_REGULAR,
    description:
      "Cabinet cleaning in Birmingham: interior cupboard and cabinet wipe-down as a Mundoria booking extra, often chosen for guest turnovers.",
    faqs: [
      faq(
        "When is cabinet cleaning available?",
        "Cabinet cleaning is offered on short-let and related bookings where cupboards need a proper interior wipe between stays.",
      ),
      faq(
        "How much does it cost?",
        "It appears as a priced extra in the booking estimate so you see the total before you confirm.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Cabinet Cleaning in Birmingham | Mundoria",
    path: "/cabinet-cleaning",
    slug: "cabinet-cleaning",
    subtitle: "Interior cupboard and cabinet cleaning as a booking extra.",
    title: "Cabinet Cleaning",
  },
  {
    addOnId: "balcony_patio",
    bookCta: "Book with patio cleaning",
    bullets: [
      "Light clean of balcony or patio areas",
      "Available on short-let style bookings",
      "Shown clearly in your estimate",
    ],
    cardImage: RESIDENTIAL_REGULAR,
    description:
      "Patio cleaning in Birmingham as a Mundoria add-on: a light clean of balcony or patio areas when you book an eligible service.",
    faqs: [
      faq(
        "Is this a full jet-wash patio service?",
        "No — this is a light clean of balcony or patio areas as part of an indoor booking, not a specialist exterior pressure-wash.",
      ),
      faq(
        "Balcony or patio?",
        "The same extra covers a light clean of either a balcony or patio, depending on the property.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Patio Cleaning Add-On | Mundoria Birmingham",
    path: "/patio-cleaning",
    slug: "patio-cleaning",
    subtitle: "Light balcony or patio cleaning as a booking extra.",
    title: "Patio Cleaning",
  },
  {
    addOnId: "extra_bathroom_detail",
    bookCta: "Book bathroom cleaning",
    bullets: [
      "Extra limescale and bathroom detail time",
      "Ideal when bathrooms need more than a standard pass",
      "Priced in your estimate before you book",
    ],
    cardImage: RESIDENTIAL_REGULAR,
    description:
      "Bathroom cleaning detail in Birmingham: extra time for limescale and bathroom surfaces as a Mundoria booking extra.",
    faqs: [
      faq(
        "How is this different from a normal clean?",
        "Standard visits already include bathrooms. This extra adds dedicated time for limescale and more detailed bathroom work.",
      ),
      faq(
        "Which bookings can include it?",
        "It is available on short-let and recovery bookings where bathroom detail is commonly needed.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Bathroom Cleaning in Birmingham | Mundoria",
    path: "/bathroom-cleaning",
    slug: "bathroom-cleaning",
    subtitle: "Extra bathroom detail and limescale care as a booking extra.",
    title: "Bathroom Cleaning",
  },
  {
    addOnId: "linen_change",
    bookCta: "Book with linen change",
    bullets: [
      "Change bed linen you or the host supply",
      "Built for Airbnb and short-let turnovers",
      "Clear price in the booking estimate",
    ],
    cardImage: RESIDENTIAL_REGULAR,
    description:
      "Linen change in Birmingham for guest turnovers: bed linen supplied by you or the host, changed as a Mundoria booking extra.",
    faqs: [
      faq(
        "Do you supply the linen?",
        "No — linen must be supplied by the customer or host. We change the beds during the turnover visit.",
      ),
      faq(
        "Which services offer linen change?",
        "It is available on Airbnb / short-let and related guest-turnover bookings.",
      ),
    ],
    heroImage: RESIDENTIAL_HERO,
    kind: "extra",
    metaTitle: "Linen Change for Short Lets | Mundoria Birmingham",
    path: "/linen-change",
    slug: "linen-change",
    subtitle: "Bed linen change for guest-ready short-let turnovers.",
    title: "Linen Change",
  },
];

export function standalonePageBySlug(slug: string) {
  return STANDALONE_PAGES.find((page) => page.slug === slug) ?? null;
}

export function standalonePageByPath(path: string) {
  const bare = path.split("?")[0]?.replace(/\/$/, "") || path;
  return STANDALONE_PAGES.find((page) => page.path === bare) ?? null;
}

export function standaloneExtraPages() {
  return STANDALONE_PAGES.filter((page) => page.kind === "extra");
}

export function standaloneDomesticPage() {
  return STANDALONE_PAGES.find((page) => page.kind === "domestic")!;
}

/** Booking deep-link for a standalone page. */
export function standaloneBookingHref(
  page: StandalonePageDef,
  configured: boolean,
) {
  if (!configured) return "/setup";
  const returnTo = encodeURIComponent(page.path);
  if (page.kind === "domestic") {
    return `/booking/new?category=residential&returnTo=${returnTo}`;
  }
  // Extras attach to a residential (or short-let) flow; start on house cleaning.
  if (
    page.addOnId === "linen_change" ||
    page.addOnId === "balcony_patio" ||
    page.addOnId === "inside_cabinets"
  ) {
    return `/booking/new?service=airbnb_turnover&returnTo=${returnTo}`;
  }
  if (page.addOnId === "extra_bathroom_detail") {
    return `/booking/new?category=short_term_rental&returnTo=${returnTo}`;
  }
  return `/booking/new?category=residential&returnTo=${returnTo}`;
}
