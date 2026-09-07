import Link from "next/link";
import type { ReactNode } from "react";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-button";
import { BrandLogo, BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const navLinks = [
  ["Services", "/cleaning"],
  ["How it works", "/how-it-works"],
  ["Pricing", "/pricing"],
  ["Birmingham", "/cleaners/birmingham"],
  ["FAQ", "/faq"],
  ["For cleaners", "/for-cleaners"],
] as const;

export function MarketingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const loginHref = configured ? "/login" : "/setup";
  const cleanerHref = configured ? "/signup" : "/setup";

  return (
    <main className={cn("min-h-screen bg-background text-foreground", className)}>
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <BrandLogo
            markClassName="h-11 w-8 sm:h-12 sm:w-9"
            wordmarkClassName="text-lg sm:text-xl"
          />
          <nav
            aria-label="Marketing navigation"
            className="hidden items-center gap-6 lg:flex"
          >
            {navLinks.map(([label, href]) => (
              <Link
                className="text-sm font-bold text-muted-foreground transition hover:text-primary"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              className="rounded-full px-4 py-2 text-sm font-black text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
              href={loginHref}
            >
              Log in
            </Link>
            <Button
              asChild
              className="h-11 rounded-full bg-foreground px-6 text-sm font-black text-background hover:bg-foreground/90"
            >
              <Link href={bookingHref}>Book a clean</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center rounded-full border border-border px-4 py-2 text-sm font-black text-foreground [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-xl">
                <nav className="grid divide-y divide-border" aria-label="Mobile marketing navigation">
                  {navLinks.map(([label, href]) => (
                    <Link
                      className="px-5 py-4 text-sm font-bold text-muted-foreground hover:bg-muted"
                      href={href}
                      key={href}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="grid gap-2 bg-muted p-4">
                  <Button asChild className="h-11 rounded-full font-black">
                    <Link href={bookingHref}>Book a clean</Link>
                  </Button>
                  <Button asChild className="h-11 rounded-full font-black" variant="outline">
                    <Link href={loginHref}>Log in</Link>
                  </Button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-card px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandMark className="h-14 w-10" />
            <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              CleanScape makes professional cleaning simple to book, track and
              complete — starting in Birmingham and expanding with reliable
              coverage.
            </p>
            <a
              className="mt-4 inline-flex text-sm font-bold text-primary"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn
              links={[
                ["All services", "/cleaning"],
                ["Pricing", "/pricing"],
                ["How it works", "/how-it-works"],
                ["FAQ", "/faq"],
              ]}
              title="Explore"
            />
            <FooterColumn
              links={[
                ["Cleaners in Birmingham", "/cleaners/birmingham"],
                ["Edgbaston", "/cleaners/birmingham/edgbaston"],
                ["Harborne", "/cleaners/birmingham/harborne"],
                ["Moseley", "/cleaners/birmingham/moseley"],
              ]}
              title="Coverage"
            />
            <FooterColumn
              links={[
                ["For cleaners", "/for-cleaners"],
                ["Book a clean", bookingHref],
                ["Become a cleaner", cleanerHref],
                ["Privacy", "/privacy"],
                ["Cookie policy", "/cookies"],
                ["Terms", "/terms"],
              ]}
              title="Company"
            />
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center gap-5 border-t border-border pt-6 text-sm font-medium text-muted-foreground">
          <Link className="transition hover:text-primary" href="/privacy">
            Privacy
          </Link>
          <Link className="transition hover:text-primary" href="/cookies">
            Cookie policy
          </Link>
          <CookieSettingsLink className="font-semibold hover:text-primary" />
          <Link className="transition hover:text-primary" href="/terms">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({
  links,
  title,
}: {
  links: Array<[string, string]>;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={href}>
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
  );
}

export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  description: string;
  eyebrow?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  title: string;
}) {
  return (
    <section className="border-b border-border bg-muted/40 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {eyebrow ? (
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild className="h-12 rounded-full px-6 font-black" variant="outline">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
