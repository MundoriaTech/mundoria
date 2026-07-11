"use client";

import {
  CalendarDays,
  Home,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/customer/notification-bell";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

interface CustomerShellProps {
  children: React.ReactNode;
  initialNotifications: Notification[];
  profile: Profile;
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: UserRound, label: "Profile" },
];

export function CustomerShell({
  children,
  initialNotifications,
  profile,
}: CustomerShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7faf8] pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div>
            <Link className="text-lg font-bold text-emerald-900" href="/dashboard">
              CleanScape
            </Link>
            <p className="text-xs text-muted-foreground">
              Hi, {profile.full_name.split(" ")[0]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:flex"
              href="/booking/new"
            >
              <Plus className="h-4 w-4" />
              Book a cleaner
            </Link>
            <NotificationBell
              initialNotifications={initialNotifications}
              userId={profile.id}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
