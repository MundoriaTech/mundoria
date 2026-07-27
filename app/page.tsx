import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Home,
  KeyRound,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  description:
    "Book certified UK cleaning professionals, manage every visit, and keep your home beautifully under control with CleanScape.",
  title: "CleanScape UK | Trusted home cleaning, beautifully managed",
};

const serviceTiles = [
  {
    accent: "#ffc79f",
    background: "linear-gradient(135deg,#fff1e8 0%,#ffc79f 100%)",
    description: "Weekly or fortnightly upkeep for everyday living.",
    href: "/booking/new",
    icon: Home,
    meta: "Most booked",
    name: "Regular",
    span: "lg:col-span-2",
    subtitle: "Cleaning",
    text: "text-[#221f50]",
  },
  {
    accent: "#ffc79f",
    background: "linear-gradient(135deg,#5a51aa 0%,#221f50 100%)",
    description: "A detailed reset for bathrooms, kitchens, build-up and corners.",
    href: "/booking/new",
    icon: Sparkles,
    meta: "Intensive",
    name: "Deep",
    span: "",
    subtitle: "Clean",
    text: "text-white",
  },
  {
    accent: "#5a51aa",
    background: "linear-gradient(135deg,#d7f3f8 0%,#b8e1ed 100%)",
    description: "Guest-ready resets with checklist confirmation and quick turnaround.",
    href: "/booking/new",
    icon: CalendarCheck,
    meta: "For hosts",
    name: "Airbnb",
    span: "",
    subtitle: "Turnover",
    text: "text-[#221f50]",
  },
  {
    accent: "#221f50",
    background: "linear-gradient(135deg,#ffe27a 0%,#ffd24f 100%)",
    description: "Move-out and move-in cleaning for deposits, agents and handovers.",
    href: "/booking/new",
    icon: KeyRound,
    meta: "Move day",
    name: "End of",
    span: "",
    subtitle: "Tenancy",
    text: "text-[#221f50]",
  },
  {
    accent: "#ffc79f",
    background: "linear-gradient(135deg,#f4b1bd 0%,#efe9ff 100%)",
    description: "A flexible refresh before guests, parties, inspections or a busy week.",
    href: "/booking/new",
    icon: BadgeCheck,
    meta: "Flexible",
    name: "One-off",
    span: "",
    subtitle: "Clean",
    text: "text-[#221f50]",
  },
  {
    accent: "#5a51aa",
    background: "linear-gradient(135deg,#ff6a35 0%,#ffc79f 100%)",
    description: "Dust, debris and finishing touches after building or renovation work.",
    href: "/booking/new",
    icon: ShieldCheck,
    meta: "Heavy duty",
    name: "Post-build",
    span: "lg:col-span-2",
    subtitle: "Cleaning",
    text: "text-[#221f50]",
  },
];

const steps = [
  {
    description:
      "Choose the clean you need, add your address, and pick a slot that works.",
    icon: CalendarCheck,
    title: "Book in minutes",
  },
  {
    description:
      "CleanScape matches your booking with certified cleaners based on service, area, availability, and performance.",
    icon: ShieldCheck,
    title: "Get matched fairly",
  },
  {
    description:
      "Track status updates, message your cleaner, confirm the checklist, and rate the experience.",
    icon: Sparkles,
    title: "Enjoy the reset",
  },
];

const trustPoints = [
  "Cleaner onboarding with ID and DBS document review",
  "GPS check-in and check-out for job accountability",
  "Card authorization first; capture happens after completion",
  "Structured dispute and rating review process",
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

const reviews = [
  {
    body: "The app made the whole clean feel managed. I knew when my cleaner was arriving, what had been completed, and when to confirm the checklist.",
    name: "Amara",
    service: "Deep clean",
  },
  {
    body: "I like that CleanScape treats cleaners like professionals. The matching, tiers, and payout flow make the platform feel serious.",
    name: "Daniel",
    service: "Cleaner partner",
  },
  {
    body: "Booking an Airbnb turnover without a long back-and-forth is exactly what I needed. Simple, clear, and tidy.",
    name: "Priya",
    service: "Airbnb turnover",
  },
];

export default function HomePage() {
  const configured = hasSupabasePublicConfig();
  const customerHref = configured ? "/signup" : "/setup";
  const cleanerHref = configured ? "/signup" : "/setup";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ff] text-[#221f50]">
      <section className="relative isolate bg-[#e9e8f7] px-4 pb-24 pt-6 sm:px-8 lg:pb-32">
        <header className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            className="rounded-full px-2 py-2 transition hover:bg-white/40"
            href="/"
          >
            <Image
              alt="CleanScape"
              className="h-auto w-36 sm:w-[203px]"
              height={46}
              priority
              src="/images/brand/cleanscape-logo.png"
              width={203}
            />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="rounded-full bg-[#ffc79f] px-5 font-bold text-[#5a51aa] hover:bg-[#ffd4b8]"
            >
              <Link href={configured ? "/login" : "/setup"}>Log in</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-[#37306c] px-5 font-bold text-white hover:bg-[#221f50]"
            >
              <Link href={customerHref}>Sign up</Link>
            </Button>
          </div>
        </header>

        <div className="relative mx-auto mt-5 max-w-7xl overflow-hidden rounded-[2rem] bg-[#dcd9ee] px-5 pt-8 shadow-2xl shadow-[#5a51aa]/10 sm:px-10 sm:pt-10 lg:min-h-[820px] lg:pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_70%,#eefaf0_0,transparent_30%),radial-gradient(circle_at_85%_28%,#eeeaff_0,transparent_42%)]" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-black sm:text-6xl lg:text-7xl">
              Book Trusted Home Cleaning in Minutes
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[#252236] sm:text-lg">
              From regular home cleaning to deep cleans, tenancy handovers and
              Airbnb turnovers, book certified professionals, track every
              booking in real time, and pay only after the job is complete.
            </p>
            <Button
              asChild
              className="mt-5 rounded-full bg-black px-7 py-5 text-sm font-bold text-white shadow-xl shadow-black/20 hover:bg-[#221f50]"
            >
              <Link href={customerHref}>Book a Service</Link>
            </Button>
          </div>

          <div className="relative z-10 mx-auto -mt-6 h-[430px] max-w-7xl sm:-mt-10 sm:h-[540px] lg:-mt-20 lg:h-[610px]">
            <Image
              alt="CleanScape home cleaning professionals"
              className="-translate-y-32 scale-[1.22] object-contain object-bottom sm:-translate-y-44 sm:scale-[1.28] lg:-translate-y-64 lg:scale-[1.35]"
              fill
              priority
              sizes="(min-width: 1024px) 1220px, 100vw"
              src="/images/brand/cleaners-hero.png"
            />
          </div>

          <div className="relative z-20 mx-auto -mt-28 max-w-5xl rounded-full bg-black px-6 py-5 text-white shadow-2xl shadow-black/25 sm:-mt-36 sm:px-10 sm:py-7 lg:-mt-44">
            <div className="grid gap-4 text-center sm:grid-cols-3 sm:text-left">
              <Metric label="service types" value="6" />
              <Metric label="protected payments" value="Pay later" />
              <Metric label="status visibility" value="Live" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8" id="services">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_0.6fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#5a51aa]">
              Explore services
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#221f50] sm:text-6xl">
              One home. Six ways to make it feel lighter.
            </h2>
          </div>
          <p className="max-w-md text-base font-medium leading-7 text-[#6c668d] lg:justify-self-end">
            Pick the outcome you need. CleanScape handles the cleaner match,
            card authorization, status tracking, messages and checklist behind
            the scenes.
          </p>
        </div>
        <div className="grid auto-rows-[minmax(260px,auto)] gap-5 lg:grid-cols-4">
          {serviceTiles.map((tile) => (
            <Link
              className={`group relative isolate flex min-h-[280px] overflow-hidden rounded-[2.25rem] p-7 transition duration-300 hover:-translate-y-1 ${tile.text} ${tile.span}`}
              href={configured ? tile.href : "/setup"}
              key={tile.name}
              style={{ background: tile.background }}
            >
              <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-white/25 blur-2xl transition group-hover:scale-110" />
              <div className="absolute -bottom-20 right-8 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
              <div className="absolute bottom-6 right-6 text-[10rem] font-black leading-none tracking-[-0.16em] opacity-[0.08]">
                CS
              </div>

              <div className="relative z-10 flex min-h-full w-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm backdrop-blur"
                    style={{ color: tile.accent }}
                  >
                    <tile.icon className="h-7 w-7" />
                  </span>
                  <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
                    {tile.meta}
                  </span>
                </div>

                <div className="mt-auto max-w-xl pt-10">
                  <h3 className="text-5xl font-semibold leading-[0.88] tracking-[-0.07em] sm:text-6xl">
                    {tile.name}
                    <span className="block">{tile.subtitle}</span>
                  </h3>
                  <p className="mt-5 max-w-md text-base font-medium leading-7 opacity-75">
                    {tile.description}
                  </p>
                  <span className="mt-6 inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition group-hover:translate-x-1">
                    Book now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="bg-white py-24"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionIntro
            eyebrow="How it works"
            title="Simple for customers. Structured for operations."
            text="CleanScape is designed to feel effortless on the surface, while giving the marketplace enough data to handle matching, quality, disputes, and payouts responsibly."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                className="rounded-[2rem] bg-[#f7f5ff] p-7"
                key={step.title}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5a51aa] text-white">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <span className="text-5xl font-semibold tracking-[-0.08em] text-[#dedbfd]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-4 leading-7 text-[#6c668d]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]" id="trust">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#5a51aa]">
            Trust layer
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Clean, clear, accountable.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#6c668d]">
            CleanScape’s brand promise is not just “a clean home.” It is a
            calmer experience: clear booking, trusted people, connected support,
            and a completion process that protects both sides.
          </p>
          <div className="mt-8 space-y-4">
            {trustPoints.map((point) => (
              <div className="flex gap-3" key={point}>
                <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-[#5a51aa]" />
                <p className="text-[#4e486e]">{point}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2.5rem] bg-[#221f50] p-5 shadow-2xl shadow-[#221f50]/15">
          <div className="rounded-[2rem] bg-white p-5">
            <div className="relative min-h-80 overflow-hidden rounded-[1.6rem] text-white">
              <Image
                alt="A cleaner mopping a modern living room floor"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                src="https://images.pexels.com/photos/36729566/pexels-photo-36729566.jpeg?auto=compress&cs=tinysrgb&w=1200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221f50] via-[#221f50]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffc79f]">
                  Live booking state
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                  Pending Match → Matched → En Route → In Progress → Completed
                </h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniCard icon={Clock3} label="Cleaner ETA" value="Visible" />
              <MiniCard icon={MapPin} label="Geofence" value="200m check" />
              <MiniCard icon={MessageCircle} label="Messages" value="In-app" />
              <MiniCard icon={Star} label="Ratings" value="Fair review" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#221f50] py-24 text-white" id="cleaners">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#ffc79f]">
              For cleaners
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              A marketplace that treats cleaning like skilled work.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/75">
              Cleaners get onboarding, service-area control, availability,
              job feeds, performance tiers, protected communication, and payout
              visibility.
            </p>
            <Button
              asChild
              className="mt-8 h-14 rounded-full bg-[#ffc79f] px-7 font-bold text-[#221f50] hover:bg-[#ffd4b8]"
            >
              <Link href={cleanerHref}>Apply to clean with CleanScape</Link>
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="relative h-72 overflow-hidden rounded-[2rem]">
              <Image
                alt="A professional cleaner vacuuming a home floor"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                src="https://images.pexels.com/photos/3890198/pexels-photo-3890198.jpeg?auto=compress&cs=tinysrgb&w=1200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221f50]/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-white/15 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-[#ffc79f]">
                  Cleaner partner tools
                </p>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  Area control, availability, job status, documents, and payout
                  visibility in one mobile-first workflow.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              "Bronze, Silver, Gold, and Rose Gold progression",
              "Postcode-prefix working areas",
              "Weekly or monthly payout preference",
              "Dispute window before low ratings affect score",
            ].map((item) => (
              <div
                className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                key={item}
              >
                <BadgeCheck className="h-6 w-6 text-[#ffc79f]" />
                <p className="mt-4 font-medium text-white/90">{item}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionIntro
          eyebrow="Social proof"
          title="Built for happy moments after the clean"
          text="CleanScape’s early product experience should make people feel looked after before, during, and after the visit."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              className="rounded-[2rem] border border-[#dedbfd] bg-white p-7 shadow-sm"
              key={review.name}
            >
              <div className="flex gap-1 text-[#ffc06f]">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star className="h-5 w-5 fill-current" key={index} />
                ))}
              </div>
              <p className="mt-6 leading-7 text-[#4e486e]">“{review.body}”</p>
              <p className="mt-6 font-semibold">{review.name}</p>
              <p className="text-sm text-[#6c668d]">{review.service}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-[2.5rem] bg-[#f7f5ff] p-8 sm:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#5a51aa]">
                  Coverage
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
                  Starting with the UK’s busiest home-service areas.
                </h2>
                <p className="mt-5 leading-8 text-[#6c668d]">
                  The platform already supports postcode-based zones, cleaner
                  working areas, and map previews, so CleanScape can expand
                  city by city without changing the booking experience.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cities.map((city) => (
                  <div
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#4e486e]"
                    key={city}
                  >
                    {city}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
        <BrandMark className="mx-auto h-20 w-20" />
        <h2 className="mt-8 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          Welcome home to a cleaner rhythm.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6c668d]">
          Book your first CleanScape clean, or apply to join the professional
          cleaner network shaping better everyday services.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-14 rounded-full px-8 text-base font-bold">
            <Link href={customerHref}>Book a cleaner</Link>
          </Button>
          <Button
            asChild
            className="h-14 rounded-full px-8 text-base font-bold"
            variant="outline"
          >
            <Link href={cleanerHref}>Become a cleaner</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#dedbfd] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link className="flex items-center gap-3" href="/">
            <Image
              alt="CleanScape"
              className="h-auto w-40"
              height={46}
              src="/images/brand/cleanscape-logo.png"
              width={203}
            />
          </Link>
          <div className="flex flex-wrap gap-5 text-sm font-medium text-[#6c668d]">
            <Link href={configured ? "/login" : "/setup"}>Sign in</Link>
            <Link href={customerHref}>Book</Link>
            <Link href={cleanerHref}>For cleaners</Link>
            <a href="mailto:support@cleanscapeuk.com">Support</a>
          </div>
        </div>
      </footer>
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

function SectionIntro({
  eyebrow,
  text,
  title,
}: {
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#5a51aa]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-[#6c668d]">{text}</p>
    </div>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f5ff] p-4">
      <Icon className="h-5 w-5 text-[#5a51aa]" />
      <p className="mt-4 text-sm text-[#6c668d]">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
