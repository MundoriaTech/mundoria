"use client";

import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  FileCheck2,
  Gauge,
  Inbox,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Newspaper,
  Percent,
  Settings,
  ShieldAlert,
  Users,
  UserRound,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { adminParentBackLink } from "@/components/admin/admin-back-link";
import { AdminAlerts } from "@/components/admin/admin-alerts";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import type { AccountMenuItem } from "@/components/shared/account-menu";
import {
  AppDashboardShell,
  type AppShellNavGroup,
} from "@/components/shared/app-dashboard-shell";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

const NAV_GROUPS: AppShellNavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin/dashboard", icon: Gauge, label: "Dashboard" },
      {
        href: "/admin/bookings",
        icon: BookOpenCheck,
        label: "Bookings",
        match: (pathname) =>
          pathname.startsWith("/admin/bookings") ||
          pathname.startsWith("/admin/booking/"),
      },
      { href: "/admin/inbox", icon: Inbox, label: "Inbox" },
      { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
      { href: "/admin/safety", icon: ShieldAlert, label: "Safety" },
      { href: "/admin/incidents", icon: AlertTriangle, label: "Incidents" },
      { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/admin/cleaners",
        icon: UsersRound,
        label: "Cleaners",
        match: (pathname) =>
          pathname.startsWith("/admin/cleaners") ||
          pathname.startsWith("/admin/cleaner/"),
      },
      {
        href: "/admin/customers",
        icon: UserRound,
        label: "Customers",
        match: (pathname) =>
          pathname.startsWith("/admin/customers") ||
          pathname.startsWith("/admin/customer/"),
      },
      { href: "/admin/verification", icon: FileCheck2, label: "Verification" },
      { href: "/admin/team", icon: Users, label: "Team" },
    ],
  },
  {
    label: "Money & coverage",
    items: [
      { href: "/admin/payouts", icon: Banknote, label: "Payouts" },
      { href: "/admin/promos", icon: Percent, label: "Promos" },
      { href: "/admin/zones", icon: MapPinned, label: "Zones" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/mag", icon: Newspaper, label: "Mundoria Mag" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const ADMIN_ACCOUNT_MENU: AccountMenuItem[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/team", icon: UserRound, label: "Your profile" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminShell({
  admin,
  children,
  notifications,
}: {
  admin: Profile;
  children: React.ReactNode;
  notifications: Notification[];
}) {
  const pathname = usePathname();
  const isMagEditor =
    pathname.startsWith("/admin/mag/") && pathname !== "/admin/mag";

  return (
    <>
      <SessionTimeoutGuard audience="admin" />
      <AppDashboardShell
        accountMenuItems={ADMIN_ACCOUNT_MENU}
        brandHref="/admin/dashboard"
        brandLabel="Operations"
        contentWidth="wide"
        fullBleed={isMagEditor}
        navGroups={NAV_GROUPS}
        notificationSlot={
          <AdminAlerts initialNotifications={notifications} userId={admin.id} />
        }
        parentLink={adminParentBackLink}
        profile={admin}
      >
        {children}
      </AppDashboardShell>
    </>
  );
}
