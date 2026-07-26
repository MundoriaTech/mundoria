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

import { TierBadge } from "@/components/cleaner/tier-badge";
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
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div>
            <Link className="font-bold text-emerald-950" href="/cleaner/dashboard">
              CleanScape Pro
            </Link>
            <p className="text-xs text-muted-foreground">
              {profile.full_name.split(" ")[0]} · {cleaner.status.replace("_", " ")}
            </p>
          </div>
          <TierBadge tier={cleaner.tier} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {cleaner.status !== "certified" && cleaner.status !== "active" ? (
          <CleanerAccountBanner cleaner={cleaner} />
        ) : null}
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
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
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold">
              {cleaner.status === "in_training"
                ? "Certification in progress"
                : "Application under review"}
            </p>
            <p className="mt-1 text-sm text-amber-900/80">
              You can explore your dashboard, update your profile, and connect
              Stripe now. New job offers will appear after your CleanScape
              certification is complete.
            </p>
            {!cleaner.stripe_onboarding_complete ? (
              <p className="mt-2 text-xs text-amber-900/70">
                Payout setup is incomplete. You can finish it later from Profile.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
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
