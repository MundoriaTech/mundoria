"use client";

import {
  CalendarDays,
  Home,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { CUSTOMER_ACCOUNT_MENU } from "@/components/shared/account-menu";
import {
  AppDashboardShell,
  type AppShellNavGroup,
} from "@/components/shared/app-dashboard-shell";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import type { Profile } from "@/types/auth";

interface CustomerShellProps {
  children: React.ReactNode;
  profile: Profile;
}

const NAV_GROUPS: AppShellNavGroup[] = [
  {
    items: [
      { exact: true, href: "/dashboard", icon: Home, label: "Home" },
      { href: "/bookings", icon: CalendarDays, label: "Sessions" },
      { href: "/messages", icon: MessageCircle, label: "Messages" },
      { href: "/profile", icon: UserRound, label: "Account" },
    ],
  },
];

export function CustomerShell({ children, profile }: CustomerShellProps) {
  const bookingHref = hasSupabasePublicConfig() ? "/booking/new" : "/setup";

  return (
    <>
      <SessionTimeoutGuard audience="customer" />
      <OneSignalEnroll />
      <AppDashboardShell
        accountMenuItems={CUSTOMER_ACCOUNT_MENU}
        brandHref="/dashboard"
        headerActions={
          <Link
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-ink px-4 text-sm font-semibold text-white transition hover:bg-brand-indigo"
            href={bookingHref}
          >
            <Plus className="h-4 w-4" />
            Book a clean
          </Link>
        }
        navGroups={NAV_GROUPS}
        profile={profile}
      >
        {children}
      </AppDashboardShell>
    </>
  );
}
