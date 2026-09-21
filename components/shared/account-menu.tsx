"use client";

import {
  CalendarDays,
  ChevronDown,
  LogOut,
  MapPin,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AccountMenuItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

export function AccountMenu({
  items,
  profile,
}: {
  items: AccountMenuItem[];
  profile: {
    avatar_url?: string | null;
    full_name: string;
    id: string;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "Account";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setSigningOut(true);
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-[#f3eef8] dark:hover:bg-muted sm:pr-2.5"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <UserAvatar
          name={profile.full_name}
          seed={profile.id}
          size="sm"
          url={profile.avatar_url}
        />
        <span className="hidden max-w-[7rem] truncate text-sm font-medium tracking-tight text-[#1c133b] sm:inline dark:text-foreground">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-3.5 w-3.5 text-[#8b8798] transition sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-56 overflow-hidden rounded-2xl border border-[#e8e0f4] bg-white py-1.5 shadow-[0_18px_40px_rgba(28,19,59,0.16)] dark:border-border dark:bg-card"
          role="menu"
        >
          <div className="border-b border-[#efe8f8] px-3.5 py-2.5 dark:border-border">
            <p className="truncate text-sm font-semibold text-[#1c133b] dark:text-foreground">
              {profile.full_name}
            </p>
            <p className="mt-0.5 text-[11px] text-[#8b8798]">Your account</p>
          </div>
          {items.map((item) => (
            <Link
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[#1c133b] transition hover:bg-[#f7f4fb] dark:text-foreground dark:hover:bg-muted"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <item.icon className="h-4 w-4 text-[#823fb2]" />
              {item.label}
            </Link>
          ))}
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-destructive transition hover:bg-destructive/5"
            disabled={signingOut}
            onClick={() => void logout()}
            role="menuitem"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const CUSTOMER_ACCOUNT_MENU: AccountMenuItem[] = [
  { href: "/profile", icon: UserRound, label: "Profile" },
  { href: "/bookings", icon: CalendarDays, label: "Sessions" },
  { href: "/addresses", icon: MapPin, label: "Addresses" },
];

export const CLEANER_ACCOUNT_MENU: AccountMenuItem[] = [
  { href: "/cleaner/profile", icon: UserRound, label: "Profile" },
];
