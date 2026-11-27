"use client";

import {
  CalendarDays,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CrmLink } from "@/components/analytics/crm-link";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import {
  DashboardBackLink,
  appParentBackLink,
} from "@/components/shared/dashboard-back-link";
import {
  AccountMenu,
  CUSTOMER_ACCOUNT_MENU,
} from "@/components/shared/account-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import { trackCrmEvent } from "@/lib/analytics/crm-events";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";

const NAV_ITEMS = [
  { exact: true, href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/bookings", icon: CalendarDays, label: "Sessions" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: UserRound, label: "Account" },
] as const;

const PAGE_COPY: Record<string, { subtitle: string; title: string }> = {
  "/addresses": {
    subtitle: "Homes and workplaces ready for your next booking.",
    title: "Addresses",
  },
  "/bookings": {
    subtitle: "Upcoming, completed and cancelled cleaning sessions.",
    title: "Sessions",
  },
  "/messages": {
    subtitle: "Chats with cleaners matched to your bookings.",
    title: "Messages",
  },
  "/payments": {
    subtitle: "Cards on file, vouchers and past receipts.",
    title: "Payments",
  },
  "/profile": {
    subtitle: "Your details, notifications and account settings.",
    title: "Account",
  },
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return desktop;
}

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]) {
  if ("exact" in item && item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function pageContext(pathname: string, firstName: string) {
  if (pathname === "/dashboard") {
    return {
      showWave: true,
      subtitle:
        "Keep track of your cleaning services, upcoming bookings and past appointments.",
      title: `Welcome back, ${firstName}!`,
    };
  }
  if (pathname.startsWith("/booking/")) {
    return {
      showWave: false,
      subtitle: "Details, payment status and receipt for this visit.",
      title: "Booking",
    };
  }
  if (/^\/messages\/[^/]+/.test(pathname)) {
    return {
      showWave: false,
      subtitle: "Message your matched cleaner about this booking.",
      title: "Conversation",
    };
  }
  const exact = PAGE_COPY[pathname];
  if (exact) return { showWave: false, ...exact };
  return {
    showWave: false,
    subtitle: "Manage your Mundoria account and bookings.",
    title: "Account",
  };
}

function CustomerSidebarFull({
  onLogout,
  onNavigate,
  pathname,
  signingOut,
}: {
  onLogout: () => void;
  onNavigate?: () => void;
  pathname: string;
  signingOut: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-[#F3F4F6] px-6 py-8">
      <span
        className="select-none text-[21px] font-bold tracking-[-0.025em] text-[#1E1848]"
      >
        Mundoria
      </span>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-3 text-[17px] no-underline transition",
                active
                  ? "bg-white font-semibold text-[#000] shadow-sm"
                  : "font-medium text-[#6B6B70] hover:bg-white/70 hover:text-[#000]",
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-8 w-[4px] -translate-y-1/2 rounded-r-full bg-[#5B5098]"
                />
              ) : null}
              <Icon
                className="h-5 w-5 shrink-0"
                strokeWidth={active ? 2.2 : 1.6}
                style={{ color: active ? "#524096" : "#6B6B70" }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        className="mb-5 flex items-center gap-3 px-3 text-[15px] font-medium text-[#6B6B70] transition hover:text-[#524096]"
        disabled={signingOut}
        onClick={onLogout}
        type="button"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {signingOut ? "Signing out..." : "Log out"}
      </button>

      <div
        className="relative overflow-hidden rounded-[14px] p-5"
        style={{
          background: "linear-gradient(145deg,#524096 0%,#7262A9 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 10%,rgba(255,255,255,0.14) 0%,transparent 60%)",
          }}
        />
        <p className="relative m-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
          Quick book
        </p>
        <p className="relative mt-1.5 m-0 text-[15px] font-bold leading-5 text-white">
          Book your next clean
        </p>
        <CrmLink
          className="relative mt-4 inline-flex h-[34px] items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
          crmEvent="book_session_click"
          crmPayload={{ action: "Book now" }}
          href="/booking/new"
          onClick={onNavigate}
        >
          Book now
          <svg
            fill="none"
            height={12}
            stroke="#524096"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.4}
            viewBox="0 0 24 24"
            width={12}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </CrmLink>
      </div>
    </div>
  );
}

export function CustomerShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const desktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const rawFirst = profile.full_name.trim().split(/\s+/)[0] || "there";
  // "bosoye" → "Bosoye" for the greeting.
  const firstName = rawFirst.charAt(0).toLocaleUpperCase("en-GB") + rawFirst.slice(1);
  const backLink = appParentBackLink(pathname);
  const { showWave, subtitle, title } = pageContext(pathname, firstName);

  async function logout() {
    setSigningOut(true);
    trackCrmEvent("logout", {
      action: "sign_out",
      customer_id: profile.id,
    });
    await createBrowserClient().auth.signOut();
    clearPersonalBrowserData();
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      <SessionTimeoutGuard audience="customer" />
      <OneSignalEnroll />

      <div
        className="min-h-screen bg-white text-[#000]"
        style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}
      >
        {!desktop ? (
          <>
            {drawerOpen ? (
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={() => setDrawerOpen(false)}
                type="button"
              />
            ) : null}

            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col bg-[#F3F4F6] shadow-2xl transition-transform duration-200 ease-out",
                drawerOpen ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <div className="flex items-center justify-between p-5">
                <span className="text-[19px] font-bold tracking-[-0.025em] text-[#1E1848]">
                  Mundoria
                </span>
                <button
                  aria-label="Close menu"
                  className="rounded-full p-2 text-[#6B6B70] hover:bg-black/5"
                  onClick={() => setDrawerOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-4">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[17px] transition",
                        active
                          ? "bg-white font-semibold text-[#000] shadow-sm"
                          : "font-medium text-[#6B6B70] hover:bg-white/70 hover:text-[#000]",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <Icon
                        className="h-5 w-5 shrink-0"
                        strokeWidth={active ? 2.2 : 1.6}
                        style={{ color: active ? "#524096" : "#6B6B70" }}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                className="mx-4 mb-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#6B6B70] transition hover:bg-white/70 hover:text-[#524096]"
                disabled={signingOut}
                onClick={() => void logout()}
                type="button"
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.6} />
                {signingOut ? "Signing out..." : "Log out"}
              </button>
            </aside>

            <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
              <div className="flex h-14 items-center gap-3 px-4">
                <button
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E1E1EA] bg-white text-[#000]"
                  onClick={() => setDrawerOpen(true)}
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[17px] font-semibold tracking-[-0.02em] text-[#1E1848]">
                    {title}
                    {showWave ? (
                      <span aria-label="wave" className="ml-1.5" role="img">
                        👋
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <NotificationBell userId={profile.id} />
                  <AccountMenu
                    items={CUSTOMER_ACCOUNT_MENU}
                    profile={profile}
                  />
                </div>
              </div>
            </header>
          </>
        ) : null}

        {desktop ? (
          <div
            className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-5"
          >
            <aside className="sticky top-5 h-[calc(100vh-40px)] w-[280px] shrink-0">
              <CustomerSidebarFull
                onLogout={() => void logout()}
                pathname={pathname}
                signingOut={signingOut}
              />
            </aside>

            <main className="flex min-w-0 flex-1 flex-col">
              <div
                className="grid items-start gap-5"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}
              >
                <div
                  className="relative flex min-h-[118px] flex-col gap-1.5 bg-[#F3F4F6] px-5 pb-5 pt-6"
                  style={{ borderRadius: "22px 22px 0 0" }}
                >
                  {backLink ? (
                    <DashboardBackLink
                      className="mb-1"
                      href={backLink.href}
                      label={backLink.label}
                    />
                  ) : null}
                  <div className="flex items-center gap-2.5">
                    <h1 className="m-0 text-[34.7px] font-semibold leading-[40px] tracking-[-0.02em] text-[#000]">
                      {title}
                    </h1>
                    {showWave ? (
                      <span aria-label="wave" role="img" className="text-[30px] leading-none">
                        👋
                      </span>
                    ) : null}
                  </div>
                  <p className="m-0 max-w-xl text-[18px] leading-[21px] text-[#5F5F66]">
                    {subtitle}
                  </p>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 right-[-22px] h-[22px] w-[22px]"
                    style={{
                      background:
                        "radial-gradient(circle at 100% 0, transparent 21.5px, #F3F4F6 22px)",
                    }}
                  />
                </div>

                <div className="flex h-[98px] shrink-0 items-center gap-4 rounded-[22px] bg-[#F3F4F6] px-4">
                  <NotificationBell userId={profile.id} />
                  <AccountMenu
                    items={CUSTOMER_ACCOUNT_MENU}
                    profile={profile}
                    variant="panel"
                  />
                </div>
              </div>

              <div
                className="flex-1 p-5"
                style={{
                  background: "#F3F4F6",
                  borderRadius: "0 22px 22px 22px",
                }}
              >
                {children}
              </div>
            </main>
          </div>
        ) : (
          <div className="min-h-[calc(100vh-3.5rem)] bg-[#F3F4F6] px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-5">
            {backLink ? (
              <DashboardBackLink
                className="mb-3 -ml-1"
                href={backLink.href}
                label={backLink.label}
              />
            ) : (
              <p className="mb-4 m-0 text-[14px] leading-5 text-[#5F5F66]">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        )}

        {!desktop ? (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
            <div
              className="mx-auto grid h-16 max-w-lg"
              style={{
                gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))`,
              }}
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                      active ? "text-[#524096]" : "text-[#6f6a82]",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.2 : 1.6}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </>
  );
}
