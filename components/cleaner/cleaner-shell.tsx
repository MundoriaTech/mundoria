"use client";

import {
  Banknote,
  BriefcaseBusiness,
  Clock3,
  Gauge,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";

const nav = [
  { href: "/cleaner/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/cleaner/jobs", icon: BriefcaseBusiness, label: "Jobs" },
  { href: "/cleaner/earnings", icon: Banknote, label: "Earnings" },
  { href: "/cleaner/messages", icon: MessageCircle, label: "Messages" },
  { href: "/cleaner/profile", icon: UserRound, label: "Profile" },
];

export function CleanerShell({
  children,
  cleaner,
  profile,
}: {
  children: React.ReactNode;
  cleaner: CleanerProfile;
  profile: Profile;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
      <SessionTimeoutGuard audience="cleaner" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <Link className="flex items-center gap-3" href="/cleaner/dashboard">
              <BrandMark className="h-10 w-7 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-bold tracking-tight text-foreground">
                  CleanScape Pro
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {profile.full_name.split(" ")[0]} ·{" "}
                  {cleaner.status.replace("_", " ")}
                </span>
              </span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle className="h-11 w-11" />
            <TierBadge className="hidden min-[380px]:inline-flex" size="sm" tier={cleaner.tier} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {cleaner.status !== "certified" && cleaner.status !== "active" ? (
          <CleanerAccountBanner cleaner={cleaner} />
        ) : null}
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function CleanerAccountBanner({ cleaner }: { cleaner: CleanerProfile }) {
  if (cleaner.status === "pending" || cleaner.status === "in_training") {
    return (
      <div className="mb-6 rounded-[1.5rem] border border-border bg-card p-5 text-foreground shadow-sm">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">
              {cleaner.status === "in_training"
                ? "Application on hold"
                : "Application under review"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {cleaner.status === "in_training"
                ? "CleanScape has put your application on hold. You can still update your profile and finish Stripe setup. Job offers appear after you’re approved."
                : "You can explore your dashboard, update your profile, and connect Stripe now. New job offers will appear after CleanScape approves your application."}
            </p>
            {!cleaner.stripe_onboarding_complete ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Payout setup is incomplete. You can finish it later from Profile.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-5 text-destructive">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Account {cleaner.status}</p>
          <p className="mt-1 text-sm">
            Your cleaner account cannot receive job offers right now. Contact
            CleanScape support if you think this is a mistake.
          </p>
        </div>
      </div>
    </div>
  );
}
