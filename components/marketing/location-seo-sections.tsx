import Link from "next/link";

import { BrandedSection } from "@/components/marketing/branded-page-sections";
import { popularMarketingServices } from "@/lib/seo/marketing";

const TRUST_PILLARS = [
  {
    body: "Book online with a clear estimate — no agency middlemen or cash-in-hand ambiguity.",
    title: "We’re efficient",
  },
  {
    body: "Change, cancel or reschedule in your account before the fee window — life happens.",
    title: "We’re flexible",
  },
  {
    body: "Regular, deep, moving, short-let and Recovery cleans tailored to your space.",
    title: "We’re accessible",
  },
] as const;

const LOCATION_FAQS = (place: string) =>
  [
    {
      answer: `Mundoria offers regular cleaning, one-off and deep cleans, end-of-tenancy / move cleans, Airbnb & short-let turnovers, commercial cleans and Mundoria Recovery support across ${place}.`,
      question: `What cleaning services does Mundoria offer in ${place}?`,
    },
    {
      answer:
        "Enter your postcode, choose a service and cleaning standard, set duration and schedule, then pay securely. We match a suitable cleaner and keep you updated through arrival and completion.",
      question: `How do I book a home cleaning session in ${place}?`,
    },
    {
      answer:
        "Estimates depend on service, property size, cleaning standard, schedule and add-ons. You’ll see a clear price before checkout — never a surprise fee after you book.",
      question: `How much is a Mundoria cleaner in ${place}?`,
    },
    {
      answer:
        "You can use your own products or ask the cleaner to bring basics where available as an add-on. Share fragrance-free or Recovery preferences in the booking notes.",
      question: "Do I need to provide cleaning supplies?",
    },
    {
      answer:
        "Cleaners on Mundoria are independent contractors who complete onboarding, identity checks and document review before going live. Payment is held securely and captured after the job.",
      question: "Are Mundoria cleaners vetted?",
    },
    {
      answer:
        "Free cancellation more than 48 hours before the visit; a partial fee may apply within 48 hours, and the full amount within 24 hours. Exact fees are confirmed in your booking.",
      question: "What is the Mundoria cancellation policy?",
    },
  ] as const;

const COVERED = [
  "Hoovering and floor care for hard floors and carpets in agreed rooms",
  "Bathroom cleaning — sinks, toilets, mirrors and visible fixtures",
  "Kitchen surfaces, sink and hob wipe-down (oven deep-clean as an add-on)",
  "Dusting and surface wipe of reachable furniture and ledges",
  "Emptying bins and light tidy of clutter-free areas",
  "Bed linen change when requested and linen is left ready",
];

export function LocationTrustStrip() {
  return (
    <BrandedSection>
      <div className="grid gap-4 md:grid-cols-3">
        {TRUST_PILLARS.map((item) => (
          <article
            className="rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(49,44,121,0.06)]"
            key={item.title}
          >
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1c133b]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5a5470]">{item.body}</p>
          </article>
        ))}
      </div>
    </BrandedSection>
  );
}

export function LocationServicesExplainer({ place }: { place: string }) {
  const popular = popularMarketingServices(5);
  return (
    <BrandedSection tone="cream">
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        What cleaning services does Mundoria offer in {place}?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a5470]">
        Mundoria connects you with independent cleaners for homes, guest turns
        and workplaces in {place}. Each booking shows a clear estimate, live
        status and checklist-led completion.
      </p>
      <ul className="mt-6 space-y-3">
        {popular.map((service) => (
          <li key={service.slug}>
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href={`/cleaning/${service.slug}`}
            >
              {service.label} in {place}
            </Link>
            <span className="text-sm text-[#5a5470]">
              {" "}
              — from {service.fromPrice}. {service.description}
            </span>
          </li>
        ))}
      </ul>
    </BrandedSection>
  );
}

export function LocationWhatsCovered({ place }: { place: string }) {
  return (
    <BrandedSection>
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        What’s covered in a Mundoria house clean in {place}?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a5470]">
        Exact scope depends on your service and cleaning standard. Typical
        residential visits include:
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-[#5a5470]">
        {COVERED.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </BrandedSection>
  );
}

export function LocationHowToBook({ place }: { place: string }) {
  const steps = [
    "Open booking and enter your postcode in " + place,
    "Choose your service and cleaning standard",
    "Add property details, duration and any add-ons",
    "Pick a date and time that works for you",
    "Pay securely — we hold payment until the clean is done",
  ];
  return (
    <BrandedSection tone="lavender">
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        How do I book a cleaner in {place}?
      </h2>
      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li
            className="flex gap-3 text-sm leading-6 text-[#5a5470]"
            key={step}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-xs font-bold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </BrandedSection>
  );
}

export function LocationFaqBlock({ place }: { place: string }) {
  const faqs = LOCATION_FAQS(place);
  return (
    <BrandedSection>
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        Frequently asked questions — {place}
      </h2>
      <div className="mt-8 space-y-3">
        {faqs.map((item) => (
          <details
            className="group rounded-[1.25rem] border border-[#e4daf5]/80 bg-white/90 px-5 py-4 shadow-[0_8px_22px_rgba(49,44,121,0.05)]"
            key={item.question}
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#1c133b] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="text-[#823fb2] transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-[#5a5470]">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#5a5470]">
        More answers in our{" "}
        <Link
          className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
          href="/help"
        >
          Help Centre
        </Link>
        .
      </p>
    </BrandedSection>
  );
}

export function LocationFeaturedCleaners({
  cleaners,
  place,
}: {
  cleaners: Array<{ areas: string; name: string; rating: number }>;
  place: string;
}) {
  if (!cleaners.length) return null;
  return (
    <BrandedSection tone="cream">
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        Independent cleaners near {place}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
        Mundoria cleaners complete onboarding and document review before
        receiving jobs. Availability varies by day and service.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cleaners.map((cleaner) => (
          <article
            className="rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(49,44,121,0.06)]"
            key={cleaner.name}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efe6ff] text-sm font-bold text-[#6a45b8]">
              {cleaner.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#1c133b]">
              {cleaner.name}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#823fb2]">
              Domestic cleaner
            </p>
            <p className="mt-2 text-sm text-[#5a5470]">{cleaner.areas}</p>
            <p className="mt-3 text-sm font-semibold text-[#1c133b]">
              {cleaner.rating.toFixed(1)} / 5
            </p>
          </article>
        ))}
      </div>
    </BrandedSection>
  );
}

export function LocationReviews({
  place,
  reviews,
}: {
  place: string;
  reviews: Array<{ author: string; body: string; service: string }>;
}) {
  if (!reviews.length) return null;
  return (
    <BrandedSection>
      <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
        Cleaning reviews in {place}
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <blockquote
            className="rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(49,44,121,0.06)]"
            key={`${review.author}-${review.service}`}
          >
            <p className="text-sm leading-7 text-[#5a5470]">“{review.body}”</p>
            <footer className="mt-4 text-sm font-semibold text-[#1c133b]">
              {review.author}
              <span className="mt-1 block text-xs font-medium text-[#823fb2]">
                {review.service}
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </BrandedSection>
  );
}
