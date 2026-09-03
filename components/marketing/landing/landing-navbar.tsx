import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { landingNavLinks } from "@/components/marketing/landing/constants";
import { dashboardForRole } from "@/lib/auth/redirects";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import type { Profile } from "@/types/auth";

export function LandingNavbar({
  customerHref,
  viewer,
}: {
  customerHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  const configured = hasSupabasePublicConfig();
  const loginHref = configured ? "/login" : "/setup";
  const accountHref = viewer ? dashboardForRole(viewer.role) : loginHref;
  const firstName = viewer?.full_name.trim().split(/\s+/)[0] ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-[#ece3f9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between gap-4 px-5 sm:h-20 sm:px-8 lg:px-12">
        <LandingLogo href="/" priority />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 xl:flex"
        >
          {landingNavLinks.map(([label, href]) =>
            href.startsWith("mailto:") ? (
              <a
                className="text-[13px] font-normal text-[#1c133b] transition hover:text-[#312c79]"
                href={href}
                key={label}
              >
                {label}
              </a>
            ) : (
              <Link
                className="text-[13px] font-normal text-[#1c133b] transition hover:text-[#312c79]"
                href={href}
                key={label}
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle />
          {viewer ? (
            <Link
              className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition hover:bg-[#f6f0ff]"
              href={accountHref}
            >
              <UserAvatar
                name={viewer.full_name}
                seed={viewer.id}
                size="sm"
                url={viewer.avatar_url}
              />
              <span className="max-w-[9rem] truncate text-sm font-semibold text-[#1c133b]">
                {firstName}
              </span>
            </Link>
          ) : (
            <Link
              className="inline-flex h-[33px] items-center justify-center rounded-full bg-[#e8bcac] px-4 text-[12px] font-semibold text-[#312c79] transition hover:bg-[#e8bcac]/90"
              href={loginHref}
            >
              Log in
            </Link>
          )}
          <Link
            className="inline-flex h-[33px] items-center justify-center rounded-full bg-[#312c79] px-4 text-[12px] font-semibold text-[#e6e5f3] transition hover:bg-[#312c79]/90"
            href={customerHref}
          >
            Book a clean
          </Link>
        </div>

        <MobileNav
          accountHref={accountHref}
          customerHref={customerHref}
          loginHref={loginHref}
          viewer={viewer}
        />
      </div>
    </header>
  );
}

function MobileNav({
  customerHref,
  loginHref,
  accountHref,
  viewer,
}: {
  customerHref: string;
  loginHref: string;
  accountHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  return (
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
        <summary className="flex cursor-pointer list-none items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-[#1c133b] [&::-webkit-details-marker]:hidden">
          Menu
        </summary>
        <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-2xl">
          <nav
            aria-label="Mobile navigation"
            className="grid divide-y divide-border"
          >
            {landingNavLinks.map(([label, href]) =>
              href.startsWith("mailto:") ? (
                <a
                  className="px-5 py-4 text-sm font-medium text-muted-foreground hover:bg-muted"
                  href={href}
                  key={label}
                >
                  {label}
                </a>
              ) : (
                <Link
                  className="px-5 py-4 text-sm font-medium text-muted-foreground hover:bg-muted"
                  href={href}
                  key={label}
                >
                  {label}
                </Link>
              ),
            )}
          </nav>
          <div className="grid gap-2 bg-[#f6f0ff] p-4">
            <Button
              asChild
              className="h-11 rounded-full bg-[#312c79] text-sm font-semibold text-[#e6e5f3] hover:bg-[#312c79]/90"
            >
              <Link href={customerHref}>Book a clean</Link>
            </Button>
            {viewer ? (
              <Button
                asChild
                className="h-11 rounded-full text-sm font-semibold"
                variant="outline"
              >
                <Link href={accountHref}>Dashboard</Link>
              </Button>
            ) : (
              <Button
                asChild
                className="h-11 rounded-full bg-[#e8bcac] text-sm font-semibold text-[#312c79] hover:bg-[#e8bcac]/90"
              >
                <Link href={loginHref}>Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
