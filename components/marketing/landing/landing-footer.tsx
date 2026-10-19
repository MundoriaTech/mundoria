import Link from "next/link";
import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
} from "@phosphor-icons/react/ssr";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-button";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import {
  LAUNCH_CITY,
  popularMarketingServices,
  servicePlacePath,
} from "@/lib/seo/marketing";

export function LandingFooter({
  cleanerHref,
  configured,
}: {
  cleanerHref: string;
  configured: boolean;
}) {
  const cleanerLoginHref = configured ? "/login/cleaner" : "/setup";
  const popularSeoServices = popularMarketingServices(4);

  const linkClass =
    "text-base font-medium text-muted-foreground transition hover:text-[#312c79]";

  const footerSections: {
    title: string;
    links: Array<
      | { href: string; label: string }
      | { action: "chat"; label: string }
    >;
  }[] = [
    {
      links: [
        { href: "/cleaning", label: "All services" },
        ...popularSeoServices.map((service) => ({
          href: servicePlacePath(service.slug),
          label: service.label,
        })),
      ],
      title: "Services",
    },
    {
      links: [
        { href: "/for-cleaners", label: "For cleaners" },
        { href: cleanerHref, label: "Become a cleaner" },
        { href: cleanerLoginHref, label: "Cleaner login" },
        {
          href: `/cleaners/${LAUNCH_CITY.slug}`,
          label: `Cleaners in ${LAUNCH_CITY.name}`,
        },
      ],
      title: "For pros",
    },
    {
      links: [
        { href: "/blog", label: "Mundoria Mag" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/contact", label: "Contact us" },
      ],
      title: "Discover",
    },
    {
      links: [
        { href: "/faq", label: "FAQ" },
        { href: "/help", label: "Help Centre" },
        { action: "chat", label: "Start a chat" },
      ],
      title: "Need help?",
    },
  ];

  return (
    <footer className="reveal-on-scroll-soft border-t border-border bg-white px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-border pb-10 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <LandingLogo href="/" />
            <p className="mt-5 max-w-xl text-pretty text-base font-light leading-7 text-muted-foreground sm:mt-6 sm:text-[17px]">
              Mundoria connects UK customers with independent cleaning
              professionals for regular cleaning, deep cleans, Airbnb turnovers
              and tenancy handovers.
            </p>
          </div>

          {footerSections.map((section) => (
            <div className="min-w-0" key={section.title}>
              <h3 className="text-[15px] font-bold uppercase tracking-[0.16em] text-[#414141]">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3 sm:mt-5">
                {section.links.map((item) => (
                  <li key={`${section.title}-${item.label}`}>
                    {"action" in item ? (
                      <ContactSupportButton
                        className={linkClass}
                        label={item.label}
                        tab="home"
                      />
                    ) : (
                      <Link className={linkClass} href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex justify-center sm:col-span-2 sm:justify-end lg:col-span-5">
            <FooterSocial />
          </div>
        </div>

        <FooterPayments />
        <div className="flex flex-col gap-5 pt-8 text-base font-medium text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© 2026 Mundoria UK. All rights reserved.</p>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-6">
              Cleaners on Mundoria are independent contractors. Availability,
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
          </div>
        </div>
      </div>
    </footer>
  );
}

const SOCIAL = [
  {
    Icon: FacebookLogo,
    className: "bg-[#1877F2] hover:brightness-110",
    href:
      process.env.NEXT_PUBLIC_FACEBOOK_URL ??
      "https://www.facebook.com/mundoriauk",
    label: "Facebook",
  },
  {
    Icon: InstagramLogo,
    className:
      "bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_55%,#6228d7_100%)] hover:brightness-110",
    href:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
      "https://www.instagram.com/mundoriauk",
    label: "Instagram",
  },
  {
    Icon: TiktokLogo,
    className: "bg-[#111111] hover:bg-[#2a2a2a]",
    href: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@mundoriauk",
    label: "TikTok",
  },
  {
    Icon: LinkedinLogo,
    className: "bg-[#0A66C2] hover:brightness-110",
    href:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ??
      "https://www.linkedin.com/company/mundoriauk",
    label: "LinkedIn",
  },
] as const;

function FooterSocial() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
      <p className="text-base font-bold text-[#1c133b]">Follow us</p>
      <ul className="flex gap-3">
        {SOCIAL.map(({ Icon, className, href, label }) => (
          <li key={label}>
            <a
              aria-label={label}
              className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              <span className="absolute inset-0 bg-[#1c133b] transition-opacity group-hover:opacity-0" />
              <span
                className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${className}`}
              />
              <Icon aria-hidden className="relative h-5 w-5" weight="fill" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PAYMENT_METHODS = [
  { alt: "Visa", src: "/images/payments/visa.svg" },
  { alt: "Mastercard", src: "/images/payments/mastercard.svg" },
  { alt: "American Express", src: "/images/payments/amex.svg" },
  { alt: "Apple Pay", src: "/images/payments/apple-pay.svg" },
  { alt: "Google Pay", src: "/images/payments/google-pay.svg" },
] as const;

function FooterPayments() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 border-b border-border py-5 lg:flex-nowrap lg:justify-start lg:gap-24 lg:py-10">
      <p className="text-base font-bold text-[#1c133b]">Accepted payment methods</p>
      <ul className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
        {PAYMENT_METHODS.map((method) => (
          <li key={method.alt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={method.alt}
              className="h-9 w-auto"
              height={36}
              src={`${method.src}?v=3`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
