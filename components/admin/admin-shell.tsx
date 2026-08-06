"use client";

import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  Gauge,
  MapPinned,
  Menu,
  Percent,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AdminAlerts } from "@/components/admin/admin-alerts";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 overflow-hidden border-r border-white/10 bg-[#221f50] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-[#ffc79f]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-[#7669d1]/30 blur-3xl" />
        <div className="relative flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link className="flex items-center gap-3 font-bold" href="/admin/dashboard">
            <BrandMark className="h-11 w-8" />
            <span>
              <span className="block text-base tracking-[-0.04em]">cleanscape</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                admin
              </span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="relative space-y-1 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-card text-foreground shadow-lg shadow-black/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffc79f] text-[#221f50]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{admin.full_name}</p>
              <p className="truncate text-xs text-white/60">{admin.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
        <button className="lg:hidden" onClick={() => setOpen(true)} type="button">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 text-sm font-semibold text-foreground lg:flex">
          <Sparkles className="h-4 w-4 text-primary" />
          Platform command centre
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Signed in as {admin.full_name}
          </span>
          <AdminAlerts initialNotifications={notifications} userId={admin.id} />
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
