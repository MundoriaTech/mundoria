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
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AdminAlerts } from "@/components/admin/admin-alerts";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

const items = [
  { href: "/admin/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/admin/cleaners", icon: UsersRound, label: "Cleaners" },
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
    <div className="min-h-screen bg-slate-100 lg:pl-64">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-slate-950 text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link className="flex items-center gap-2 font-bold" href="/admin/dashboard">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            CleanScape Admin
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
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
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{admin.full_name}</p>
              <p className="truncate text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
        <button className="lg:hidden" onClick={() => setOpen(true)} type="button">
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-auto flex items-center gap-3">
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
