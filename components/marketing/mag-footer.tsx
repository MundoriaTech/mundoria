import Link from "next/link";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-button";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { BLOG_CATEGORIES } from "@/lib/content/editorial";

export function MagFooter({
  bookingHref,
  showBookCta = true,
}: {
  bookingHref: string;
  showBookCta?: boolean;
}) {
  const categories = BLOG_CATEGORIES.filter((item) => item !== "All");

  const footerSections = [
    {
      links: categories.map(
        (label) =>
          [label, `/blog?category=${encodeURIComponent(label)}`] as [
            string,
            string,
          ],
      ),
      title: "Magazine",
    },
    {
      links: [
        ["All stories", "/blog"],
        ["Help Centre", "/help"],
        ["Contact us", "/help"],
      ] as [string, string][],
      title: "Guides",
    },
    {
      links: [
        ...(showBookCta
          ? ([["Book a clean", bookingHref]] as [string, string][])
          : []),
        ["Home", "/"],
        ["For cleaners", "/for-cleaners"],
        ["How it works", "/how-it-works"],
      ] as [string, string][],
      title: "Mundoria",
    },
    {
      links: [
        ["Privacy", "/privacy"],
        ["Cookie policy", "/cookies"],
        ["Terms", "/terms"],
      ] as [string, string][],
      title: "Legal",
    },
  ];

  return (
    <footer className="border-t border-border bg-white px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-border pb-10 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              className="text-[1.35rem] font-black tracking-[-0.06em] text-[#1c133b] sm:text-[1.55rem]"
              href="/blog"
            >
              Mundoria <span className="text-[#d4694a]">Mag</span>
            </Link>
            <p className="mt-5 max-w-xl text-pretty text-sm font-light leading-7 text-muted-foreground sm:mt-6">
              Cleaning & home magazine — practical guides, host tips and
              Birmingham stories for real homes.
            </p>
            <div className="mt-5 sm:mt-6">
              <ContactSupportButton className="text-sm font-semibold text-[#6a45b8] transition hover:text-[#5a38a3]" />
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
            <p>© {new Date().getFullYear()} Mundoria Mag. All rights reserved.</p>
            <p className="mt-2 max-w-2xl text-pretty text-xs leading-6">
              Stories and tips from the Mundoria team. Availability and services
              may vary by location.
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
          </div>
        </div>
      </div>
    </footer>
  );
}
