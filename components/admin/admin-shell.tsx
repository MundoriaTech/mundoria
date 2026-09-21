"use client";

import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  Gauge,
  LogOut,
  MapPinned,
  Menu,
  Newspaper,
  Percent,
  Settings,
  Users,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminAlerts } from "@/components/admin/admin-alerts";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  match?: (pathname: string) => boolean;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operations",
    items: [
      { href: "/admin/dashboard", icon: Gauge, label: "Dashboard" },
      { href: "/admin/bookings", icon: BookOpenCheck, label: "Bookings" },
      { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
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
          pathname === "/admin/cleaners" ||
          pathname.startsWith("/admin/cleaners/") ||
          pathname.startsWith("/admin/cleaner/"),
      },
      {
        href: "/admin/customers",
        icon: UserRound,
        label: "Customers",
        match: (pathname) =>
          pathname === "/admin/customers" ||
          pathname.startsWith("/admin/customer/"),
      },
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

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, item: NavItem) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function pageTitle(pathname: string) {
  const match = ALL_ITEMS.find((item) => isActive(pathname, item));
  if (match) {
    if (match.href === "/admin/mag" && pathname !== "/admin/mag") {
      return pathname.includes("/new") ? "New Mag post" : "Edit Mag post";
    }
    if (match.href === "/admin/cleaners" && pathname !== "/admin/cleaners") {
      return "Cleaner";
    }
    if (match.href === "/admin/customers" && pathname !== "/admin/customers") {
      return "Customer";
    }
    if (
      match.href === "/admin/bookings" &&
      pathname.startsWith("/admin/booking/")
    ) {
      return "Booking";
    }
    return match.label;
  }
  if (pathname.startsWith("/admin/booking/")) return "Booking";
  return "Admin";
}

function pageEyebrow(pathname: string) {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => isActive(pathname, item))) {
      return group.label;
    }
  }
  return "Operations";
}

function SidebarNav({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav className="relative min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white text-[#1c133b] shadow-lg shadow-black/20"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const title = pageTitle(pathname);
  const eyebrow = pageEyebrow(pathname);
  const firstName = admin.full_name.trim().split(/\s+/)[0] || "Admin";
  const isMagEditor =
    pathname.startsWith("/admin/mag/") && pathname !== "/admin/mag";
  const hidePageTitle =
    isMagEditor ||
    pathname === "/admin/dashboard" ||
    pathname === "/admin/mag";

  async function logout() {
    setSigningOut(true);
    await createBrowserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sidebarFooter = (
    <div className="relative shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/15"
        href="/admin/team"
        onClick={() => setOpen(false)}
      >
        <UserAvatar
          className="ring-2 ring-white/20"
          name={admin.full_name}
          seed={admin.id}
          size="sm"
          url={admin.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{admin.full_name}</p>
          <p className="truncate text-xs text-white/60">{admin.email}</p>
        </div>
      </Link>
      <button
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        disabled={signingOut}
        onClick={() => void logout()}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out…" : "Log out"}
      </button>
    </div>
  );

  const sidebarBrand = (
    <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:h-[4.25rem] sm:px-5">
      <div className="min-w-0">
        <LandingLogo
          className="text-[1.3rem]"
          href="/admin/dashboard"
          variant="onDark"
        />
        <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0a888]">
          Operations
        </p>
      </div>
      <button
        aria-label="Close menu"
        className="rounded-full p-2 text-white/80 hover:bg-white/10 lg:hidden"
        onClick={() => setOpen(false)}
        type="button"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf8ff] text-[#1c133b] lg:pl-64">
      <SessionTimeoutGuard audience="admin" />

      {open ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#1c133b]/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col bg-[#1c133b] text-white shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-[#f0a888]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-40 w-40 rounded-full bg-[#823fb2]/40 blur-3xl" />
        {sidebarBrand}
        <SidebarNav onNavigate={() => setOpen(false)} pathname={pathname} />
        {sidebarFooter}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#1c133b] text-white lg:flex">
        <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-[#f0a888]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-40 w-40 rounded-full bg-[#823fb2]/35 blur-3xl" />
        {sidebarBrand}
        <SidebarNav pathname={pathname} />
        {sidebarFooter}
      </aside>

      <header className="sticky top-0 z-30 border-b border-[#ece3f9]/90 bg-[#faf8ff]/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
          <button
            aria-label="Open menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4daf5] bg-white text-[#1c133b] lg:hidden"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            {!hidePageTitle ? (
              <div className="lg:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#823fb2]">
                  {eyebrow}
                </p>
                <p className="truncate text-sm font-semibold">{title}</p>
              </div>
            ) : (
              <div className="lg:hidden">
                <LandingLogo
                  className="text-[1.2rem]"
                  href="/admin/dashboard"
                />
                <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                  Operations
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <AdminAlerts
              initialNotifications={notifications}
              userId={admin.id}
            />
            <Link
              className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-[#f0e9fb] sm:pr-2.5"
              href="/admin/team"
            >
              <UserAvatar
                name={admin.full_name}
                seed={admin.id}
                size="sm"
                url={admin.avatar_url}
              />
              <span className="hidden max-w-[7rem] truncate text-sm font-medium tracking-tight sm:inline">
                {firstName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "w-full",
          isMagEditor
            ? "px-0 py-0"
            : "px-3 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-7 lg:px-8 lg:py-8",
        )}
      >
        {!hidePageTitle ? (
          <div className="mb-5 hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-3xl">
              {title}
            </h1>
          </div>
        ) : null}
        <div className={isMagEditor ? undefined : "mx-auto max-w-[1400px]"}>
          {children}
        </div>
      </main>
    </div>
  );
}
