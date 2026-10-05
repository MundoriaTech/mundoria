"use client";

import {
  CalendarDays,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { AppDashboardShell } from "@/components/shared/app-dashboard-shell";
import { CUSTOMER_ACCOUNT_MENU } from "@/components/shared/account-menu";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import type { Profile } from "@/types/auth";

interface CustomerShellProps {
  children: React.ReactNode;
  profile: Profile;
}

const navItems = [
  { exact: true, href: "/dashboard", icon: Home, label: "Home" },
  { href: "/bookings", icon: CalendarDays, label: "Sessions" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: UserRound, label: "Account" },
];

export function CustomerShell({
  children,
  profile,
}: CustomerShellProps) {
  return (
    <>
      <SessionTimeoutGuard audience="customer" />
      <OneSignalEnroll />
      <AppDashboardShell
        accountMenuItems={CUSTOMER_ACCOUNT_MENU}
        brandHref="/dashboard"
        navItems={navItems}
        profile={profile}
        roleLabel="Customer"
      >
        {children}
      </AppDashboardShell>
    </>
  );
}
