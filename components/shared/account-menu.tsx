"use client";

import { useFeedback } from "@/components/shared/feedback-provider";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MedallionAvatar } from "@/components/shared/medallion-avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

export type AccountMenuItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export function AccountMenu({
  items,
  profile,
  tier,
  variant = "compact",
}: {
  items: AccountMenuItem[];
  profile: {
    avatar_url?: string | null;
    email?: string | null;
    full_name: string;
    id: string;
  };
  /** When set, wraps the avatar in the metal medallion ring. */
  tier?: CleanerTier | null;
  /** `panel` matches the customer dashboard header card. */
  variant?: "compact" | "panel";
}) {
  const { confirm } = useFeedback();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "Account";
  const isPanel = variant === "panel";

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function openFromHover() {
    if (!canHover) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (!canHover) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

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
    setOpen(false);
    const confirmed = await confirm({
      action: "Log out",
      description: "You will need to sign in again to see your account.",
      title: "Log out of Mundoria?",
      variant: "destructive",
    });
    if (!confirmed) return;
    setSigningOut(true);
    const { trackCrmEvent } = await import("@/lib/analytics/crm-events");
    trackCrmEvent("logout", {
      action: "sign_out",
      customer_id: profile.id,
    });
    // Loaded on demand so public pages that show this menu don't ship supabase-js up front.
    const { createBrowserClient } = await import("@/lib/supabase/client");
    await createBrowserClient().auth.signOut();
    clearPersonalBrowserData();
    const loginPath = pathname.startsWith("/cleaner")
      ? "/login/cleaner"
      : pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
    router.replace(loginPath);
    router.refresh();
  }

  return (
    <div
      className={cn("relative", isPanel && "min-w-0")}
      onMouseEnter={openFromHover}
      onMouseLeave={scheduleClose}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={
          isPanel
            ? "flex min-w-0 items-center gap-3 rounded-[16px] py-1.5 pl-1 pr-2 text-left transition hover:bg-white/60"
            : "inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-[#f3eef8] dark:hover:bg-muted sm:pr-2.5"
        }
        onClick={() => {
          if (canHover) {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setOpen(true);
            return;
          }
          setOpen((current) => !current);
        }}
        type="button"
      >
        {tier ? (
          <MedallionAvatar
            avatarUrl={profile.avatar_url}
            className="shrink-0"
            name={profile.full_name}
            preview={false}
            seed={profile.id}
            size={isPanel ? "md" : "sm"}
            tier={tier}
          />
        ) : (
          <UserAvatar
            className="shrink-0"
            name={profile.full_name}
            preview={false}
            seed={profile.id}
            size={isPanel ? "md" : "sm"}
            url={profile.avatar_url}
          />
        )}
        {isPanel ? (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[17.4px] font-semibold leading-5 text-[#000]">
                {profile.full_name}
              </span>
              {profile.email ? (
                <span className="truncate text-[15px] leading-5 text-[#5F5F66]">
                  {profile.email}
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[#6B6B70] transition",
                open && "rotate-180",
              )}
            />
          </>
        ) : (
          <>
            <span className="hidden max-w-[7rem] truncate text-sm font-medium tracking-tight text-[#1c133b] sm:inline dark:text-foreground">
              {firstName}
            </span>
            <ChevronDown
              className={cn(
                "hidden h-3.5 w-3.5 text-[#6f6a82] transition sm:block",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 pt-1.5">
          <div
            className="w-56 overflow-hidden rounded-2xl border border-[#e8e0f4] bg-white py-1.5 shadow-[0_18px_40px_rgba(28,19,59,0.16)] dark:border-border dark:bg-card"
            role="menu"
          >
            <div className="border-b border-[#efe8f8] px-3.5 py-2.5 dark:border-border">
              <p className="truncate text-sm font-semibold text-[#1c133b] dark:text-foreground">
                {profile.full_name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[#6f6a82]">
                {profile.email || "Your account"}
              </p>
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
        </div>
      ) : null}
    </div>
  );
}

export const CUSTOMER_ACCOUNT_MENU: AccountMenuItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: UserRound, label: "Profile" },
  { href: "/bookings", icon: CalendarDays, label: "Sessions" },
  { href: "/addresses", icon: MapPin, label: "Addresses" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
];

export const CLEANER_ACCOUNT_MENU: AccountMenuItem[] = [
  { href: "/cleaner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cleaner/profile", icon: UserRound, label: "Profile" },
  { href: "/cleaner/jobs", icon: BriefcaseBusiness, label: "Jobs" },
  { href: "/cleaner/diary", icon: CalendarDays, label: "Diary" },
  { href: "/cleaner/earnings", icon: Banknote, label: "Earnings" },
  { href: "/cleaner/performance", icon: Gauge, label: "Performance" },
  { href: "/cleaner/incidents", icon: ShieldAlert, label: "Incidents" },
];
