import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandLogo, BrandMark } from "@/components/shared/brand-mark";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { dashboardForRole } from "@/lib/auth/redirects";
import {
  SERVICE_CATEGORIES,
  SERVICES,
} from "@/lib/customer/services";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole, type Profile } from "@/types/auth";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Book certified UK cleaning professionals for homes, workplaces, short-term rentals, exterior cleaning and recovery support with CleanScape.",
  path: "/",
  title: "CleanScape UK | Trusted cleaning, beautifully managed",
});

export const dynamic = "force-dynamic";

const categoryImages: Record<string, string> = {
  commercial:
    "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=900",
  exterior:
    "https://images.pexels.com/photos/37440103/pexels-photo-37440103.jpeg?auto=compress&cs=tinysrgb&w=900",
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

const popularSeoServices = popularMarketingServices(6);

export default async function HomePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const customerHref = bookingHref;
  const cleanerHref = configured ? "/signup" : "/setup";

  let viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null =
    null;
  if (configured) {
    try {
      const supabase = createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name,avatar_url,role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile && isUserRole(profile.role)) {
          viewer = profile;
        }
      }
    } catch {
      viewer = null;
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingNavbar
        configured={configured}
        customerHref={customerHref}
        viewer={viewer}
      />

      <section className="relative isolate bg-background px-3 pb-16 pt-3 min-[380px]:px-4 sm:px-8 sm:pb-24 sm:pt-5 lg:pb-32">
        <div className="relative mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.5rem] bg-card px-4 pt-7 shadow-2xl shadow-[#5a51aa]/10 min-[380px]:px-5 sm:mt-5 sm:rounded-[2rem] sm:px-10 sm:pt-10 lg:min-h-[820px] lg:pt-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-muted/80 to-transparent" />
          <div className="relative z-30 mx-auto max-w-4xl text-center">
            <h1 className="text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.06em] text-foreground min-[380px]:text-5xl sm:text-6xl sm:leading-[1.05] sm:tracking-[-0.055em] lg:text-7xl">
              Book Trusted Home Cleaning in Minutes
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-foreground min-[380px]:text-base sm:mt-4 sm:text-lg sm:leading-7">
              From residential and commercial cleaning to short-term rentals,
              exterior work and recovery support — book certified professionals,
              track every visit, and pay only after the job is complete.
            </p>
            <Button
              asChild
              className="relative z-30 mt-4 rounded-full bg-foreground px-6 py-4 text-sm font-bold text-background shadow-xl shadow-foreground/20 hover:bg-foreground/90 sm:mt-5 sm:px-7 sm:py-5"
            >
              <Link href={bookingHref}>Book a Service</Link>
            </Button>
          </div>

          <div className="pointer-events-none relative z-10 mx-auto mt-0 h-[320px] max-w-7xl min-[380px]:h-[360px] sm:-mt-10 sm:h-[540px] lg:-mt-20 lg:h-[610px]">
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

          <div className="relative z-20 mx-auto -mt-20 max-w-5xl rounded-[1.5rem] bg-foreground px-5 py-5 text-background shadow-2xl shadow-foreground/25 min-[380px]:-mt-24 sm:-mt-36 sm:rounded-full sm:px-10 sm:py-7 lg:-mt-44">
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
        className="bg-card px-5 py-24 sm:px-8"
        id="services"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
                Smart Service categories
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1] tracking-[-0.05em] text-foreground sm:text-6xl">
                Every cleaning need, clearly organised.
              </h2>
            </div>
            <p className="max-w-lg text-base font-medium leading-7 text-muted-foreground">
              Choose a category to start — CleanScape guides you to the right
              service, cleaning standard and optional add-ons.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviceTiles.map((tile, index) => (
              <ScrollReveal delay={index * 70} key={tile.name}>
                <Link
                  className="group block overflow-hidden rounded-[1.35rem] bg-card shadow-[0_14px_38px_rgba(18,16,40,0.08)] ring-1 ring-border transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(18,16,40,0.12)]"
                  href={configured ? tile.href : "/setup"}
                >
                  <div className="relative h-56 overflow-hidden bg-muted">
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
                      <h3 className="text-xl font-black tracking-[-0.03em] text-foreground">
                        {tile.name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {tile.note}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                      {tile.description}
                    </p>
                    <span className="mt-6 inline-flex text-sm font-black text-foreground">
                      Start booking →
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-14">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-foreground">
              Popular services
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServiceTiles.map((tile) => (
                <Link
                  className="rounded-2xl border border-border bg-muted p-5 transition hover:border-primary/40 hover:bg-card"
                  href={configured ? tile.href : "/setup"}
                  key={tile.name}
                >
                  <p className="font-black text-foreground">{tile.name}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
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
        className="bg-muted px-5 py-24 sm:px-8"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
                Why it works
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.05em] text-foreground sm:text-5xl">
                Simple on the surface. Serious underneath.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-muted-foreground">
                Customers should not need to understand marketplace mechanics.
                CleanScape keeps those details tidy in the background.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[1.35rem] bg-muted ring-1 ring-border md:grid-cols-3">
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
                  className="bg-card p-7"
                  delay={index * 90}
                  key={title}
                >
                  <p className="text-2xl font-black tracking-[-0.035em] text-foreground">
                    {title}
                  </p>
                  <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
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
        className="bg-card px-5 py-24 sm:px-8"
        id="reviews"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
            <div>
              <h2 className="max-w-3xl text-4xl font-black leading-[1] tracking-[-0.05em] text-foreground sm:text-6xl">
                Over 10,000 happy cleans
              </h2>
              <p className="mt-6 text-lg font-bold text-foreground">
                Our average rating is{" "}
                <span className="text-5xl font-black tracking-[-0.05em]">
                  4.9/5
                </span>
              </p>
              <p className="mt-2 text-lg font-semibold text-muted-foreground">
                What about your home?
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((review, index) => (
                <ScrollReveal
                  className="rounded-[1.25rem] border border-border bg-card p-6 shadow-[0_12px_34px_rgba(18,16,40,0.06)]"
                  delay={index * 90}
                  key={review.name}
                >
                  <p className="text-sm font-black tracking-[0.12em] text-[#f2bd3d]">
                    ★★★★★
                  </p>
                  <p className="mt-5 text-sm font-medium leading-7 text-muted-foreground">
                    “{review.quote}”
                  </p>
                  <p className="mt-6 text-sm font-black text-foreground">
                    {review.name}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
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
        className="bg-muted px-5 py-24 sm:px-8"
        id="about"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[460px] overflow-hidden rounded-[1.5rem] bg-muted">
            <Image
              alt="A professional cleaner preparing a home"
              className="image-ease object-cover"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=1200"
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
              We are CleanScape
            </p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.05em] text-foreground sm:text-6xl">
              Home services with a visible standard.
            </h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {[
                "Helping customers reclaim time without losing control of the job.",
                "Giving independent cleaners clearer work, fairer reviews and payout visibility.",
                "Building a cleaning platform where every booking has status, evidence and accountability.",
              ].map((item) => (
                <p className="py-5 font-medium leading-7 text-muted-foreground" key={item}>
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
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
        className="bg-card px-5 py-24 sm:px-8"
        id="coverage"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.06em] text-foreground sm:text-6xl">
            Launching in Birmingham — then expanding with real coverage
          </h2>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground">
            {LAUNCH_CITY.summary}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              className="rounded-2xl border border-border bg-muted p-6 transition hover:border-primary/40 hover:bg-card sm:col-span-2 lg:col-span-1"
              href={`/cleaners/${LAUNCH_CITY.slug}`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                City
              </p>
              <h3 className="mt-3 text-2xl font-black text-foreground">
                Cleaners in Birmingham
              </h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Browse neighbourhood pages and popular services.
              </p>
            </Link>
            {BIRMINGHAM_AREAS.slice(0, 5).map((area) => (
              <Link
                className="rounded-2xl border border-border bg-muted p-6 transition hover:border-primary/40 hover:bg-card"
                href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
                key={area.slug}
              >
                <h3 className="text-lg font-black text-foreground">
                  {area.name}
                </h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-14">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-foreground">
              Popular services
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularSeoServices.map((service) => (
                <Link
                  className="rounded-2xl border border-border bg-muted p-5 transition hover:border-primary/40 hover:bg-card"
                  href={`/cleaning/${service.slug}`}
                  key={service.slug}
                >
                  <p className="font-black text-foreground">{service.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                    From {service.fromPrice} · {service.description}
                  </p>
                </Link>
              ))}
            </div>
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
          <div className="rounded-[1.5rem] bg-card p-6 text-foreground sm:p-8">
            <div className="divide-y divide-border text-sm font-bold">
              {[
                "Live booking status",
                "In-app cleaner messaging",
                "Checklist-led completion",
                "Secure card payment",
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
              className="mt-6 h-14 w-full rounded-full bg-foreground text-base font-black text-background hover:bg-foreground/90"
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
      <p className="text-2xl font-semibold tracking-tight text-background">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-background/60">
        {label}
      </p>
    </div>
  );
}

function LandingNavbar({
  configured,
  customerHref,
  viewer,
}: {
  configured: boolean;
  customerHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  const loginHref = configured ? "/login" : "/setup";
  const accountHref = viewer ? dashboardForRole(viewer.role) : loginHref;
  const firstName = viewer?.full_name.trim().split(/\s+/)[0] ?? "";
  const navLinks = [
    ["Services", "/cleaning"],
    ["How it works", "/how-it-works"],
    ["Pricing", "/pricing"],
    ["Birmingham", `/cleaners/${LAUNCH_CITY.slug}`],
    ["For cleaners", "/for-cleaners"],
    ["FAQ", "/faq"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
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
              className="text-sm font-bold text-muted-foreground transition hover:text-primary"
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {viewer ? (
            <Link
              className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition hover:bg-muted"
              href={accountHref}
            >
              <UserAvatar
                name={viewer.full_name}
                seed={viewer.id}
                size="sm"
                url={viewer.avatar_url}
              />
              <span className="max-w-[9rem] truncate text-sm font-bold text-foreground">
                {firstName}
              </span>
            </Link>
          ) : (
            <Link
              className="rounded-full px-4 py-2 text-sm font-black text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
              href={loginHref}
            >
              Log in
            </Link>
          )}
          <Button
            asChild
            className="h-11 rounded-full bg-foreground px-6 text-sm font-black text-background hover:bg-foreground/90"
          >
            <Link href={customerHref}>Book a clean</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          {viewer ? (
            <Link
              aria-label={`Open account for ${viewer.full_name}`}
              className="shrink-0"
              href={accountHref}
            >
              <UserAvatar
                name={viewer.full_name}
                seed={viewer.id}
                size="sm"
                url={viewer.avatar_url}
              />
            </Link>
          ) : null}
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center rounded-full border border-border px-4 py-2 text-sm font-black text-foreground [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-2xl shadow-[#221f50]/15">
              {viewer ? (
                <Link
                  className="flex items-center gap-3 border-b border-border px-5 py-4 hover:bg-muted"
                  href={accountHref}
                >
                  <UserAvatar
                    name={viewer.full_name}
                    seed={viewer.id}
                    size="sm"
                    url={viewer.avatar_url}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {viewer.full_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Go to dashboard
                    </span>
                  </span>
                </Link>
              ) : null}
              <nav
                aria-label="Mobile navigation"
                className="grid divide-y divide-border"
              >
                {navLinks.map(([label, href]) => (
                  <Link
                    className="px-5 py-4 text-sm font-bold text-muted-foreground hover:bg-muted"
                    href={href}
                    key={label}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="grid gap-2 bg-muted p-4">
                <Button
                  asChild
                  className="h-11 rounded-full bg-foreground text-sm font-black text-background hover:bg-foreground/90"
                >
                  <Link href={customerHref}>Book a clean</Link>
                </Button>
                {viewer ? (
                  <Button
                    asChild
                    className="h-11 rounded-full text-sm font-black"
                    variant="outline"
                  >
                    <Link href={accountHref}>Dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="h-11 rounded-full text-sm font-black"
                    variant="outline"
                  >
                    <Link href={loginHref}>Log in</Link>
                  </Button>
                )}
              </div>
            </div>
          </details>
        </div>
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
        ["Pricing", "/pricing"],
        ["FAQ", "/faq"],
      ],
      title: "Customers",
    },
    {
      links: [
        ["All services", "/cleaning"],
        ...popularSeoServices
          .slice(0, 4)
          .map((service) => [service.label, `/cleaning/${service.slug}`] as [string, string]),
      ],
      title: "Services",
    },
    {
      links: [
        ["For cleaners", "/for-cleaners"],
        ["Become a cleaner", cleanerHref],
        ["Cleaner login", loginHref],
        ["Birmingham coverage", `/cleaners/${LAUNCH_CITY.slug}`],
      ],
      title: "Cleaners",
    },
    {
      links: [
        ["How it works", "/how-it-works"],
        ["Coverage", "#coverage"],
        ["About CleanScape", "#about"],
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
      ],
      title: "Company",
    },
  ];

  return (
    <footer className="reveal-on-scroll-soft bg-card px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-border pb-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo markClassName="h-12 w-9" wordmarkClassName="text-2xl" />
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-muted-foreground">
              CleanScape connects UK customers with independent cleaning
              professionals for regular cleaning, deep cleans, Airbnb turnovers
              and tenancy handovers.
            </p>
            <div className="mt-6 grid gap-2 text-sm font-semibold text-muted-foreground">
              <a
                className="w-fit transition hover:text-primary"
                href="mailto:support@cleanscapeuk.com"
              >
                support@cleanscapeuk.com
              </a>
              <a
                className="w-fit transition hover:text-primary"
                href="mailto:hello@cleanscapeuk.com"
              >
                hello@cleanscapeuk.com
              </a>
              <p>Serving homes across major UK cities.</p>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">
                {section.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {section.links.map(([label, href]) => (
                  <li key={`${section.title}-${label}`}>
                    <Link
                      className="text-sm font-semibold text-muted-foreground transition hover:text-primary"
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

        <div className="flex flex-col gap-6 pt-8 text-sm font-semibold text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© 2026 CleanScape UK. All rights reserved.</p>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
              Cleaners on CleanScape are independent contractors. Availability,
              pricing and coverage may vary by location and service type.
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link className="transition hover:text-primary" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-primary" href="/terms">
              Terms
            </Link>
            <Link
              className="transition hover:text-primary"
              href={configured ? "/login" : "/setup"}
            >
              Login
            </Link>
            <a
              className="transition hover:text-primary"
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
