import Link from "next/link";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-button";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import {
  LAUNCH_CITY,
  popularMarketingServices,
} from "@/lib/seo/marketing";

export function LandingFooter({
  cleanerHref,
  configured,
}: {
  cleanerHref: string;
  configured: boolean;
}) {
  const bookingHref = configured ? "/booking/new" : "/setup";
  const loginHref = configured ? "/login" : "/setup";
  const popularSeoServices = popularMarketingServices(4);

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
        ...popularSeoServices.map(
          (service) =>
            [service.label, `/cleaning/${service.slug}`] as [string, string],
        ),
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
        ["Cookie policy", "/cookies"],
        ["Terms", "/terms"],
      ],
      title: "Company",
    },
  ];

  return (
    <footer className="reveal-on-scroll-soft border-t border-border bg-white px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-border pb-10 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <LandingLogo href="/" />
            <p className="mt-5 max-w-xl text-pretty text-sm font-light leading-7 text-muted-foreground sm:mt-6">
              CleanScape connects UK customers with independent cleaning
              professionals for regular cleaning, deep cleans, Airbnb turnovers
              and tenancy handovers.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-medium text-muted-foreground sm:mt-6">
              <a
                className="w-fit break-all transition hover:text-[#312c79]"
                href="mailto:support@cleanscapeuk.com"
              >
                support@cleanscapeuk.com
              </a>
              <a
                className="w-fit break-all transition hover:text-[#312c79]"
                href="mailto:hello@cleanscapeuk.com"
              >
                hello@cleanscapeuk.com
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div className="min-w-0" key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#414141]">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3 sm:mt-5">
                {section.links.map(([label, href]) => (
                  <li key={`${section.title}-${label}`}>
                    <Link
                      className="text-sm font-medium text-muted-foreground transition hover:text-[#312c79]"
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

        <div className="flex flex-col gap-5 pt-8 text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© 2026 CleanScape UK. All rights reserved.</p>
            <p className="mt-2 max-w-2xl text-pretty text-xs leading-6">
              Cleaners on CleanScape are independent contractors. Availability,
              pricing and coverage may vary by location and service type.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <Link className="transition hover:text-[#312c79]" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-[#312c79]" href="/cookies">
              Cookie policy
            </Link>
            <CookieSettingsLink className="transition hover:text-[#312c79]">
              Manage cookies
            </CookieSettingsLink>
            <Link className="transition hover:text-[#312c79]" href="/terms">
              Terms
            </Link>
            <Link
              className="transition hover:text-[#312c79]"
              href={configured ? "/login" : "/setup"}
            >
              Login
            </Link>
            <a
              className="transition hover:text-[#312c79]"
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
