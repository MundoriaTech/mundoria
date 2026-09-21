"use client";

import {
  CalendarDays,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { NotificationBell } from "@/components/customer/notification-bell";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { AppDashboardShell } from "@/components/shared/app-dashboard-shell";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

interface CustomerShellProps {
  children: React.ReactNode;
  initialNotifications: Notification[];
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
  initialNotifications,
  profile,
}: CustomerShellProps) {
  return (
    <>
      <SessionTimeoutGuard audience="customer" />
      <OneSignalEnroll />
      <AppDashboardShell
        brandHref="/dashboard"
        headerExtra={
          <NotificationBell
            initialNotifications={initialNotifications}
            userId={profile.id}
          />
        }
        navItems={navItems}
        profile={profile}
        roleLabel="Customer"
      >
        {children}
      </AppDashboardShell>
    </>
  );
}
