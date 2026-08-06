import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandLogo, BrandMark } from "@/components/shared/brand-mark";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Button } from "@/components/ui/button";
import {
  SERVICE_CATEGORIES,
  SERVICES,
} from "@/lib/customer/services";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  description:
    "Book certified UK cleaning professionals for homes, workplaces, short-term rentals, exterior cleaning and recovery support with CleanScape.",
  title: "CleanScape UK | Trusted cleaning, beautifully managed",
};

const categoryImages: Record<string, string> = {
  commercial:
    "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=900",
  exterior:
    "https://images.pexels.com/photos/48889/pexels-photo-48889.jpeg?auto=compress&cs=tinysrgb&w=900",
  recovery:
    "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=900",
  residential:
    "https://images.pexels.com/photos/8055207/pexels-photo-8055207.jpeg?auto=compress&cs=tinysrgb&w=900",
  short_term_rental:
    "https://images.pexels.com/photos/15146054/pexels-photo-15146054.jpeg?auto=compress&cs=tinysrgb&w=900",
};

const categoryNotes: Record<string, string> = {
  commercial: "Workplaces",
  exterior: "Specialist",
  recovery: "Support",
  residential: "Most booked",
  short_term_rental: "For hosts",
};

const serviceTiles = SERVICE_CATEGORIES.map((category) => ({
  description: category.description,
  href: `/booking/new?category=${category.value}`,
  image: categoryImages[category.value],
  name: category.label,
  note: categoryNotes[category.value] ?? "Explore",
}));

const featuredServices = [
  "regular",
  "deep_clean",
  "end_of_tenancy",
  "airbnb_turnover",
  "office",
  "bereavement_support",
] as const;

const featuredServiceTiles = featuredServices.map((serviceType) => {
  const service = SERVICES.find((item) => item.value === serviceType)!;
  return {
    description: service.description,
    href: `/booking/new?service=${service.value}`,
    name: service.label,
  };
});

const testimonials = [
  {
    detail: "Regular cleaning customer",
    name: "Maya",
    quote:
      "The clean felt effortless. I booked in a few minutes, got updates, and the checklist made the finish feel really transparent.",
  },
  {
    detail: "Airbnb host",
    name: "Daniel",
    quote:
      "Turnovers used to be a panic. CleanScape gives me the status trail I need before a guest arrives.",
  },
  {
    detail: "Deep clean customer",
    name: "Aisha",
    quote:
      "The cleaner was punctual, careful and professional. The whole flow felt calm instead of transactional.",
  },
];

const cities = [
  "London",
  "Birmingham",
  "Manchester",
  "Leeds",
  "Bristol",
  "Croydon",
  "Luton",
  "Slough",
  "Milton Keynes",
  "Coventry",
  "Liverpool",
  "Chelmsford",
];

const cityServiceColumns = SERVICE_CATEGORIES.map((category) => ({
  href: `/booking/new?category=${category.value}`,
  links: cities.slice(0, 8).map((city) => `${category.label} in ${city}`),
  service: category.label.replace(" Cleaning", ""),
}));

export default function HomePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const customerHref = bookingHref;
  const cleanerHref = configured ? "/signup" : "/setup";

  return (
    <main className="min-h-screen bg-[#f7f5ff] text-[#221f50]">
      <LandingNavbar
        cleanerHref={cleanerHref}
        configured={configured}
        customerHref={customerHref}
      />

      <section className="relative isolate bg-[#e9e8f7] px-3 pb-16 pt-3 min-[380px]:px-4 sm:px-8 sm:pb-24 sm:pt-5 lg:pb-32">
        <div className="relative mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.5rem] bg-[#dcd9ee] px-4 pt-7 shadow-2xl shadow-[#5a51aa]/10 min-[380px]:px-5 sm:mt-5 sm:rounded-[2rem] sm:px-10 sm:pt-10 lg:min-h-[820px] lg:pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_70%,#eefaf0_0,transparent_30%),radial-gradient(circle_at_85%_28%,#eeeaff_0,transparent_42%)]" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.06em] text-black min-[380px]:text-5xl sm:text-6xl sm:leading-[1.05] sm:tracking-[-0.055em] lg:text-7xl">
              Book Trusted Home Cleaning in Minutes
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-[#252236] min-[380px]:text-base sm:mt-4 sm:text-lg sm:leading-7">
              From residential and commercial cleaning to short-term rentals,
              exterior work and recovery support — book certified professionals,
              track every visit, and pay only after the job is complete.
            </p>
            <Button
              asChild
              className="mt-4 rounded-full bg-black px-6 py-4 text-sm font-bold text-white shadow-xl shadow-black/20 hover:bg-[#221f50] sm:mt-5 sm:px-7 sm:py-5"
            >
              <Link href={bookingHref}>Book a Service</Link>
            </Button>
          </div>

          <div className="relative z-10 mx-auto mt-0 h-[320px] max-w-7xl min-[380px]:h-[360px] sm:-mt-10 sm:h-[540px] lg:-mt-20 lg:h-[610px]">
            <Image
              alt="CleanScape home cleaning professionals"
              className="absolute left-1/2 top-[-190px] h-auto w-[650px] max-w-none -translate-x-1/2 min-[380px]:top-[-220px] min-[380px]:w-[760px] sm:hidden"
              height={958}
              priority
              sizes="760px"
              src="/images/brand/cleaners-hero.png"
              width={1440}
            />
            <Image
              alt=""
              aria-hidden="true"
              className="hidden object-contain object-bottom sm:block sm:-translate-y-44 sm:scale-[1.28] lg:-translate-y-64 lg:scale-[1.35]"
              fill
              priority
              sizes="(min-width: 1024px) 1220px, 100vw"
              src="/images/brand/cleaners-hero.png"
            />
          </div>

          <div className="relative z-20 mx-auto -mt-20 max-w-5xl rounded-[1.5rem] bg-black px-5 py-5 text-white shadow-2xl shadow-black/25 min-[380px]:-mt-24 sm:-mt-36 sm:rounded-full sm:px-10 sm:py-7 lg:-mt-44">
            <div className="grid gap-4 text-center min-[380px]:grid-cols-3 min-[380px]:text-left">
              <Metric label="service categories" value="5" />
              <Metric label="services available" value={`${SERVICES.length}+`} />
              <Metric label="status visibility" value="Live" />
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal
        as="section"
        className="bg-white px-5 py-24 sm:px-8"
        id="services"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5a51aa]">
                Smart Service categories
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1] tracking-[-0.05em] text-[#2d2b35] sm:text-6xl">
                Every cleaning need, clearly organised.
              </h2>
            </div>
            <p className="max-w-lg text-base font-medium leading-7 text-[#69657a]">
              Choose a category to start — CleanScape guides you to the right
              service, cleaning standard and optional add-ons.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviceTiles.map((tile, index) => (
              <ScrollReveal delay={index * 70} key={tile.name}>
                <Link
                  className="group block overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_38px_rgba(18,16,40,0.08)] ring-1 ring-[#ededf4] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(18,16,40,0.12)]"
                  href={configured ? tile.href : "/setup"}
                >
                  <div className="relative h-56 overflow-hidden bg-[#f0eff5]">
                    <Image
                      alt={tile.name}
                      className="image-ease object-cover group-hover:scale-[1.03]"
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      src={tile.image}
                    />
                  </div>
                  <div className="min-h-[178px] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black tracking-[-0.03em] text-[#2d2b35]">
                        {tile.name}
                      </h3>
                      <span className="rounded-full bg-[#f6f4ff] px-3 py-1 text-xs font-bold text-[#5a51aa]">
                        {tile.note}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#6f6a80]">
                      {tile.description}
                    </p>
                    <span className="mt-6 inline-flex text-sm font-black text-[#2d2b35]">
                      Start booking →
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-14">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-[#2d2b35]">
              Popular services
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServiceTiles.map((tile) => (
                <Link
                  className="rounded-2xl border border-[#ededf4] bg-[#fbfaf7] p-5 transition hover:border-[#5a51aa]/40 hover:bg-white"
                  href={configured ? tile.href : "/setup"}
                  key={tile.name}
                >
                  <p className="font-black text-[#2d2b35]">{tile.name}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#6f6a80]">
                    {tile.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="bg-[#fbfaf7] px-5 py-24 sm:px-8"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5a51aa]">
                Why it works
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.05em] text-[#2d2b35] sm:text-5xl">
                Simple on the surface. Serious underneath.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-[#69657a]">
                Customers should not need to understand marketplace mechanics.
                CleanScape keeps those details tidy in the background.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[1.35rem] bg-[#e8e5ee] ring-1 ring-[#e8e5ee] md:grid-cols-3">
              {[
                [
                  "Choose",
                  "Pick a category, service and standard — we advise if something fits better.",
                ],
                [
                  "Track",
                  "See booking progress, cleaner assignment and messages in one place.",
                ],
                [
                  "Confirm",
                  "Review the checklist after completion before payment is captured.",
                ],
              ].map(([title, text], index) => (
                <ScrollReveal
                  className="bg-white p-7"
                  delay={index * 90}
                  key={title}
                >
                  <p className="text-2xl font-black tracking-[-0.035em] text-[#2d2b35]">
                    {title}
                  </p>
                  <p className="mt-4 text-sm font-medium leading-7 text-[#69657a]">
                    {text}
                  </p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="bg-white px-5 py-24 sm:px-8"
        id="reviews"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
            <div>
              <h2 className="max-w-3xl text-4xl font-black leading-[1] tracking-[-0.05em] text-[#2d2b35] sm:text-6xl">
                Over 10,000 happy cleans
              </h2>
              <p className="mt-6 text-lg font-bold text-[#2d2b35]">
                Our average rating is{" "}
                <span className="text-5xl font-black tracking-[-0.05em]">
                  4.9/5
                </span>
              </p>
              <p className="mt-2 text-lg font-semibold text-[#69657a]">
                What about your home?
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((review, index) => (
                <ScrollReveal
                  className="rounded-[1.25rem] border border-[#ededf4] bg-white p-6 shadow-[0_12px_34px_rgba(18,16,40,0.06)]"
                  delay={index * 90}
                  key={review.name}
                >
                  <p className="text-sm font-black tracking-[0.12em] text-[#f2bd3d]">
                    ★★★★★
                  </p>
                  <p className="mt-5 text-sm font-medium leading-7 text-[#4c485b]">
                    “{review.quote}”
                  </p>
                  <p className="mt-6 text-sm font-black text-[#2d2b35]">
                    {review.name}
                  </p>
                  <p className="text-xs font-semibold text-[#817c90]">
                    {review.detail}
                  </p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="bg-[#fbfaf7] px-5 py-24 sm:px-8"
        id="about"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[460px] overflow-hidden rounded-[1.5rem] bg-[#e9e6dd]">
            <Image
              alt="A professional cleaner preparing a home"
              className="image-ease object-cover"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=1200"
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5a51aa]">
              We are CleanScape
            </p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.05em] text-[#2d2b35] sm:text-6xl">
              Home services with a visible standard.
            </h2>
            <div className="mt-8 divide-y divide-[#e1dde9] border-y border-[#e1dde9]">
              {[
                "Helping customers reclaim time without losing control of the job.",
                "Giving independent cleaners clearer work, fairer reviews and payout visibility.",
                "Building a cleaning platform where every booking has status, evidence and accountability.",
              ].map((item) => (
                <p className="py-5 font-medium leading-7 text-[#69657a]" key={item}>
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-black px-6 font-black text-white hover:bg-[#221f50]"
              >
                <Link href={customerHref}>Book a clean</Link>
              </Button>
              <Button
                asChild
                className="h-12 rounded-full px-6 font-black"
                variant="outline"
              >
                <Link href={cleanerHref}>Become a cleaner</Link>
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="bg-white px-5 py-24 sm:px-8"
        id="coverage"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.06em] text-[#2b2933] sm:text-6xl">
            CleanScape services in our top cities
          </h2>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {cityServiceColumns.map((column, index) => (
              <ScrollReveal delay={index * 70} key={column.service}>
                <h3 className="text-lg font-black tracking-[-0.03em] text-[#221f50]">
                  {column.service}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link
                        className="text-sm font-semibold text-[#6f6990] transition hover:text-[#5a51aa]"
                        href={configured ? column.href : "/setup"}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="bg-[#17143d] px-5 py-20 text-white sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <BrandMark className="h-16 w-11" />
            <h2 className="mt-8 max-w-3xl text-4xl font-black leading-[1] tracking-[-0.05em] sm:text-6xl">
              Welcome home.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/70">
              Book, message, track, confirm and pay from one calm place.
              CleanScape keeps the service simple on the surface and rigorous
              underneath.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-6 text-[#221f50] sm:p-8">
            <div className="divide-y divide-[#ece9f2] text-sm font-bold">
              {[
                "Live booking status",
                "In-app cleaner messaging",
                "Checklist-led completion",
                "Protected card authorization",
              ].map((item) => (
                <div
                  className="py-4 first:pt-0 last:pb-0"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <Button
              asChild
              className="mt-6 h-14 w-full rounded-full bg-black text-base font-black text-white hover:bg-[#221f50]"
            >
              <Link href={customerHref}>Book my cleaning</Link>
            </Button>
          </div>
        </div>
      </ScrollReveal>

      <LandingFooter cleanerHref={cleanerHref} configured={configured} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-white/60">
        {label}
      </p>
    </div>
  );
}

function LandingNavbar({
  cleanerHref,
  configured,
  customerHref,
}: {
  cleanerHref: string;
  configured: boolean;
  customerHref: string;
}) {
  const loginHref = configured ? "/login" : "/setup";
  const navLinks = [
    ["Services", "#services"],
    ["How it works", "#how-it-works"],
    ["Reviews", "#reviews"],
    ["Coverage", "#coverage"],
    ["For cleaners", cleanerHref],
    ["Support", "mailto:support@cleanscapeuk.com"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#ebe8f3] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <BrandLogo
          className="rounded-full py-2 pr-3 transition hover:opacity-80"
          markClassName="h-11 w-8 sm:h-12 sm:w-9"
          wordmarkClassName="text-lg sm:text-xl"
        />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navLinks.map(([label, href]) => (
            <Link
              className="text-sm font-bold text-[#4f4a63] transition hover:text-[#5a51aa]"
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            className="rounded-full px-4 py-2 text-sm font-black text-[#4f4a63] transition hover:bg-[#f6f4ff] hover:text-[#221f50]"
            href={loginHref}
          >
            Log in
          </Link>
          <Button
            asChild
            className="h-11 rounded-full bg-black px-6 text-sm font-black text-white hover:bg-[#221f50]"
          >
            <Link href={customerHref}>Book a clean</Link>
          </Button>
        </div>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-full border border-[#dedbfd] px-4 py-2 text-sm font-black text-[#221f50] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-[#ebe8f3] bg-white shadow-2xl shadow-[#221f50]/15">
            <nav
              aria-label="Mobile navigation"
              className="grid divide-y divide-[#f0edf7]"
            >
              {navLinks.map(([label, href]) => (
                <Link
                  className="px-5 py-4 text-sm font-bold text-[#4f4a63] hover:bg-[#fbfaf7]"
                  href={href}
                  key={label}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="grid gap-2 bg-[#fbfaf7] p-4">
              <Button
                asChild
                className="h-11 rounded-full bg-black text-sm font-black text-white hover:bg-[#221f50]"
              >
                <Link href={customerHref}>Book a clean</Link>
              </Button>
              <Button
                asChild
                className="h-11 rounded-full text-sm font-black"
                variant="outline"
              >
                <Link href={loginHref}>Log in</Link>
              </Button>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

function LandingFooter({
  cleanerHref,
  configured,
}: {
  cleanerHref: string;
  configured: boolean;
}) {
  const bookingHref = configured ? "/booking/new" : "/setup";
  const loginHref = configured ? "/login" : "/setup";
  const footerSections = [
    {
      links: [
        ["Book a cleaner", bookingHref],
        ["Customer login", loginHref],
        ["My bookings", configured ? "/bookings" : "/setup"],
        ["Saved addresses", configured ? "/addresses" : "/setup"],
      ],
      title: "Customers",
    },
    {
      links: serviceTiles.map((service) => [service.name, bookingHref]),
      title: "Services",
    },
    {
      links: [
        ["Become a cleaner", cleanerHref],
        ["Cleaner login", loginHref],
        ["Cleaner dashboard", configured ? "/cleaner/dashboard" : "/setup"],
        ["Earnings", configured ? "/cleaner/earnings" : "/setup"],
      ],
      title: "Cleaners",
    },
    {
      links: [
        ["How it works", "#how-it-works"],
        ["Reviews", "#reviews"],
        ["Coverage", "#coverage"],
        ["About CleanScape", "#about"],
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
      ],
      title: "Company",
    },
  ];

  return (
    <footer className="reveal-on-scroll-soft bg-white px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-[#ebe8f3] pb-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo markClassName="h-12 w-9" wordmarkClassName="text-2xl" />
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-[#69657a]">
              CleanScape connects UK customers with independent cleaning
              professionals for regular cleaning, deep cleans, Airbnb turnovers
              and tenancy handovers.
            </p>
            <div className="mt-6 grid gap-2 text-sm font-semibold text-[#4f4a63]">
              <a
                className="w-fit transition hover:text-[#5a51aa]"
                href="mailto:support@cleanscapeuk.com"
              >
                support@cleanscapeuk.com
              </a>
              <a
                className="w-fit transition hover:text-[#5a51aa]"
                href="mailto:hello@cleanscapeuk.com"
              >
                hello@cleanscapeuk.com
              </a>
              <p>Serving homes across major UK cities.</p>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#2d2b35]">
                {section.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {section.links.map(([label, href]) => (
                  <li key={`${section.title}-${label}`}>
                    <Link
                      className="text-sm font-semibold text-[#69657a] transition hover:text-[#5a51aa]"
                      href={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 pt-8 text-sm font-semibold text-[#817c90] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© 2026 CleanScape UK. All rights reserved.</p>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-[#9a95a8]">
              Cleaners on CleanScape are independent contractors. Availability,
              pricing and coverage may vary by location and service type.
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link className="transition hover:text-[#5a51aa]" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-[#5a51aa]" href="/terms">
              Terms
            </Link>
            <Link
              className="transition hover:text-[#5a51aa]"
              href={configured ? "/login" : "/setup"}
            >
              Login
            </Link>
            <a
              className="transition hover:text-[#5a51aa]"
              href="mailto:support@cleanscapeuk.com"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
