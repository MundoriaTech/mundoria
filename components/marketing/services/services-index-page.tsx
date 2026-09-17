import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { LazyImage } from "@/components/shared/lazy-image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { bookingServiceImages } from "@/lib/customer/booking-flow";
import { MARKETING_SERVICES } from "@/lib/seo/marketing";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/types/customer";

type ServiceLink = {
  description: string;
  href: string;
  image: string;
  label: string;
};

type ServiceGroup = {
  description: string;
  href: string;
  label: string;
  soft: string;
  services: ServiceLink[];
};

function marketingByValue(value: ServiceType) {
  return MARKETING_SERVICES.find((service) => service.value === value)!;
}

function bookable(
  value: ServiceType,
  bookingHref: string,
  labelOverride?: string,
): ServiceLink {
  const service = marketingByValue(value);
  return {
    description: service.description,
    href: bookingHref === "/setup" ? "/setup" : service.bookingHref,
    image: bookingServiceImages[value],
    label: labelOverride ?? service.label,
  };
}

function pageOnly(
  bookingHref: string,
  items: Array<{
    description: string;
    label: string;
    seedService: ServiceType;
  }>,
): ServiceLink[] {
  return items.map((item) => {
    const seed = marketingByValue(item.seedService);
    return {
      description: item.description,
      href: bookingHref === "/setup" ? "/setup" : seed.bookingHref,
      image: bookingServiceImages[item.seedService],
      label: item.label,
    };
  });
}

function buildGroups(bookingHref: string): ServiceGroup[] {
  return [
    {
      description:
        "Homes, flats and guest turns — everyday upkeep through to deeper resets.",
      href: "/cleaning/residential",
      label: "Residential Cleaning",
      soft: "#efe6ff",
      services: [
        bookable("regular", bookingHref),
        bookable("deep_clean", bookingHref),
        bookable("one_off", bookingHref),
        bookable("same_day", bookingHref),
        ...pageOnly(bookingHref, [
          {
            description:
              "Routine domestic cleaning for kitchens, living areas and bathrooms.",
            label: "Domestic Cleaning",
            seedService: "regular",
          },
          {
            description:
              "Ongoing housekeeping support to keep your home consistently tidy.",
            label: "Housekeeping",
            seedService: "regular",
          },
          {
            description: "A thorough seasonal refresh for the whole home.",
            label: "Spring Cleaning",
            seedService: "regular",
          },
        ]),
        bookable("move_in", bookingHref),
        bookable("move_out", bookingHref),
        bookable("end_of_tenancy", bookingHref),
        bookable(
          "airbnb_turnover",
          bookingHref,
          "Airbnb/Shortlet Cleaning",
        ),
      ],
    },
    {
      description:
        "Offices, retail and shared spaces with clearer scope before you book.",
      href: "/cleaning/commercial",
      label: "Commercial Cleaning",
      soft: "#f8e4d4",
      services: [
        bookable("office", bookingHref),
        bookable("retail_hospitality", bookingHref),
        bookable("educational_facility", bookingHref),
        bookable("communal_area", bookingHref),
        bookable("serviced_accommodation", bookingHref),
      ],
    },
    {
      description:
        "Cleaning that adapts when life does — with more personal consideration.",
      href: "/cleaning/recovery",
      label: "Mundoria Recovery",
      soft: "#f0e4f8",
      services: [
        ...pageOnly(bookingHref, [
          {
            description:
              "Supportive home cleaning during pregnancy and after birth.",
            label: "Pregnancy and Postpartum Cleaning",
            seedService: "pregnancy_support",
          },
          {
            description:
              "Extra-care cleaning while recovering from illness, injury or limited mobility.",
            label: "Illness and Injury Recovery Cleaning",
            seedService: "illness_recovery",
          },
        ]),
        bookable(
          "hospital_discharge",
          bookingHref,
          "Hospital Discharge Home Cleaning",
        ),
        bookable(
          "bereavement_support",
          bookingHref,
          "Bereavement Support Cleaning",
        ),
      ],
    },
  ];
}

const POPULAR_VALUES: ServiceType[] = [
  "regular",
  "deep_clean",
  "end_of_tenancy",
  "airbnb_turnover",
  "office",
  "same_day",
];

const POPULAR_TINTS = [
  "bg-[#efe6ff]",
  "bg-[#f7f0d8]",
  "bg-[#f8e4d4]",
  "bg-[#f0e4f8]",
  "bg-[#e8e0f9]",
  "bg-[#f6d6d4]",
] as const;

export function ServicesIndexPage({ bookingHref }: { bookingHref: string }) {
  const groups = buildGroups(bookingHref);
  const popular = POPULAR_VALUES.map((value, index) => {
    const service = marketingByValue(value);
    return {
      description: service.description,
      href: bookingHref === "/setup" ? "/setup" : service.bookingHref,
      image: bookingServiceImages[value],
      label: service.label,
      tint: POPULAR_TINTS[index % POPULAR_TINTS.length],
    };
  });

  return (
    <div className="relative overflow-hidden bg-[#faf8ff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] sm:h-[30rem]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 12% 0%, rgba(244, 176, 140, 0.45) 0%, transparent 58%), radial-gradient(ellipse 50% 40% at 88% 8%, rgba(232, 188, 140, 0.35) 0%, transparent 52%), linear-gradient(180deg, #f4ebe3 0%, #f7f0ea 48%, #faf8ff 100%)",
        }}
      />

      <section className="relative px-4 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-14 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-2xl text-balance text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#1c133b] sm:text-5xl lg:text-[3.35rem]">
            Cleaning services, clearly laid out.
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-[15px] font-normal leading-6 text-[#5a5470] sm:text-base sm:leading-7">
            Jump straight into a service, or browse by category below. Same calm
            booking flow either way — with a clear estimate before you confirm.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-7 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
              href={bookingHref}
            >
              Book a clean
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9ccef] bg-white/80 px-7 text-sm font-semibold text-[#312c79] backdrop-blur-sm transition hover:border-[#6a45b8]/40 hover:bg-white"
              href={bookingHref}
            >
              Get a quote
            </Link>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
              Popular right now
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-[#5a5470]">
              A quick path into the services people book most.
            </p>
          </ScrollReveal>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((service, index) => (
              <ScrollReveal delay={index * 50} key={service.label}>
                <Link
                  className={cn(
                    "group flex items-center gap-3.5 rounded-[1.35rem] p-3 pr-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(49,44,121,0.12)]",
                    service.tint,
                  )}
                  href={service.href}
                >
                  <div className="relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-[1.1rem] bg-white/50 shadow-sm">
                    <LazyImage
                      alt=""
                      className="object-cover transition duration-500 group-hover:scale-105"
                      fill
                      sizes="68px"
                      src={service.image}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-[#1c133b]">
                      {service.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[#5a5470]">
                      {service.description}
                    </p>
                  </div>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-[#6a45b8] opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="relative space-y-4 px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-5">
          {groups.map((group, groupIndex) => (
            <ScrollReveal delay={groupIndex * 40} key={group.label}>
              <section
                className="overflow-hidden rounded-[1.75rem] border border-[#e4daf5]/80 bg-white/80 shadow-[0_12px_40px_rgba(49,44,121,0.06)] backdrop-blur-sm"
                id={slugify(group.label)}
              >
                <div
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6"
                  style={{ backgroundColor: group.soft }}
                >
                  <div className="max-w-xl">
                    <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-[1.6rem]">
                      {group.label}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-[#5a5470]">
                      {group.description}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#1c133b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#312c79] sm:self-auto"
                    href={group.href}
                  >
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <ul className="divide-y divide-[#eee8f7]">
                  {group.services.map((service) => (
                    <li key={service.label}>
                      <Link
                        className="group flex items-start gap-3.5 px-5 py-4 transition hover:bg-[#f7f2fc]/80 sm:items-center sm:gap-4 sm:px-7"
                        href={service.href}
                      >
                        <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#f3ebff] sm:mt-0 sm:h-14 sm:w-14">
                          <LazyImage
                            alt=""
                            className="object-cover transition duration-500 group-hover:scale-105"
                            fill
                            sizes="56px"
                            src={service.image}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1c133b] transition group-hover:text-[#6a45b8]">
                            {service.label}
                          </p>
                          <p className="mt-0.5 text-sm leading-5 text-[#6b6580]">
                            {service.description}
                          </p>
                        </div>
                        <ArrowRight
                          aria-hidden
                          className="mt-1 h-4 w-4 shrink-0 text-[#b5a8d4] transition group-hover:translate-x-0.5 group-hover:text-[#6a45b8] sm:mt-0"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#1c133b] px-4 py-14 text-white sm:px-8 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[#823fb2]/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#d4694a]/25 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <LandingLogo className="h-7 w-auto" variant="onDark" />
            <h2 className="mt-4 text-[1.6rem] font-semibold tracking-[-0.03em] sm:text-2xl">
              Ready when you are.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
              Tell us about your space — we’ll keep the next steps clear.
            </p>
          </div>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#1c133b] transition hover:bg-[#e8e0f9]"
            href={bookingHref}
          >
            Book a clean
          </Link>
        </div>
      </section>
    </div>
  );
}

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
