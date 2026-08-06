"use client";

import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  Gauge,
  LogOut,
  MapPinned,
  Menu,
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
import { BrandMark } from "@/components/shared/brand-mark";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

const items = [
  { href: "/admin/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/admin/cleaners", icon: UsersRound, label: "Cleaners" },
  { href: "/admin/customers", icon: UserRound, label: "Customers" },
  { href: "/admin/bookings", icon: BookOpenCheck, label: "Bookings" },
  { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
  { href: "/admin/payouts", icon: Banknote, label: "Payouts" },
  { href: "/admin/zones", icon: MapPinned, label: "Zones" },
  { href: "/admin/promos", icon: Percent, label: "Promo Codes" },
  { href: "/admin/team", icon: Users, label: "Team" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

function pageTitle(pathname: string) {
  const match = items.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (match) return match.label;
  if (pathname.startsWith("/admin/cleaner/")) return "Cleaner";
  if (pathname.startsWith("/admin/customer/")) return "Customer";
  if (pathname.startsWith("/admin/booking/")) return "Booking";
  return "Admin";
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background lg:pl-64">
      <SessionTimeoutGuard audience="admin" />
      {open ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-[#221f50] text-white transition-transform duration-200 ease-out lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-[#ffc79f]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-[#7669d1]/30 blur-3xl" />
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:h-20 sm:px-5">
          <Link
            className="flex min-w-0 items-center gap-3 font-bold"
            href="/admin/dashboard"
            onClick={() => setOpen(false)}
          >
            <BrandMark className="h-10 w-7 shrink-0 sm:h-11 sm:w-8" />
            <span className="min-w-0">
              <span className="block truncate text-base tracking-[-0.04em]">
                cleanscape
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                admin
              </span>
            </span>
          </Link>
          <button
            aria-label="Close menu"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="relative min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pb-4">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-card text-foreground shadow-lg shadow-black/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
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
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            disabled={signingOut}
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur sm:h-16 sm:px-6">
        <button
          aria-label="Open menu"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card lg:hidden"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle className="h-11 w-11" />
          <UserAvatar
            className="hidden sm:inline-flex"
            name={admin.full_name}
            seed={admin.id}
            size="sm"
            url={admin.avatar_url}
          />
          <AdminAlerts initialNotifications={notifications} userId={admin.id} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
