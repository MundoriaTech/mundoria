"use client";

import {
  CalendarDays,
  Home,
  MessageCircle,
  UserRound,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DashboardBackLink, appParentBackLink } from "@/components/shared/dashboard-back-link";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";

const NAV_ITEMS = [
  { exact: true, href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/bookings", icon: CalendarDays, label: "Sessions" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: UserRound, label: "Account" },
];

function isActive(pathname: string, item: (typeof NAV_ITEMS)[0]) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function CustomerSidebarNav({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav className="absolute left-[39px] top-[166px] flex flex-col gap-[31px]">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            className={cn(
              "flex h-[24px] items-center gap-[16px] text-[22.8px] no-underline transition-colors",
              active ? "font-semibold text-[#000]" : "font-medium text-[#6B6B70] hover:text-[#000]",
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon
              className="h-[26px] w-[26px] shrink-0"
              strokeWidth={active ? 2.2 : 1.6}
              style={{ color: active ? "#524096" : "#6B6B70" }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function CustomerSidebarFull({
  onNavigate,
  pathname,
  onLogout,
  signingOut,
}: {
  onNavigate?: () => void;
  pathname: string;
  onLogout: () => void;
  signingOut: boolean;
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-[22px] bg-[#F3F4F6]">
      {/* Logo */}
      <span
        className="absolute select-none"
        style={{ left: "30px", top: "38px", fontSize: "21px", fontWeight: 700, letterSpacing: "-0.025em", color: "#1E1848" }}
      >
        Mundoria
      </span>

      {/* Active indicator bar */}
      {NAV_ITEMS.some((item) => isActive(pathname, item)) && (
        <div
          className="absolute left-0 w-[10px] rounded-r-[10px] bg-[#5B5098]"
          style={{
            top: `${149 + NAV_ITEMS.findIndex((item) => isActive(pathname, item)) * (24 + 31)}px`,
            height: "56px",
          }}
        />
      )}

      <CustomerSidebarNav onNavigate={onNavigate} pathname={pathname} />

      {/* Logout button (bottom, above promo) */}
      <button
        className="absolute flex items-center gap-3 text-[15px] font-medium text-[#6B6B70] transition hover:text-[#524096]"
        disabled={signingOut}
        onClick={onLogout}
        style={{ left: "30px", bottom: "220px" }}
        type="button"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {signingOut ? "Signing out…" : "Log out"}
      </button>

      {/* Promo card */}
      <div
        className="absolute overflow-hidden rounded-[14px]"
        style={{ left: "20px", top: "730px", width: "240px", height: "178px", background: "linear-gradient(145deg,#524096 0%,#7262A9 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 80% 10%,rgba(255,255,255,0.14) 0%,transparent 60%)" }}
        />
        <svg className="absolute opacity-[0.09]" fill="none" height={130} style={{ right: "-14px", bottom: "-14px" }} viewBox="0 0 24 24" width={130}>
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} />
          <path d="M9 21V12h6v9" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} />
        </svg>
        <div className="absolute left-5 top-5 right-5">
          <p style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0 }}>Quick book</p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: "20px", marginTop: "5px" }}>Book your next clean</p>
        </div>
        <Link
          className="absolute flex items-center gap-2 rounded-full bg-white font-semibold transition hover:bg-[#ECE8F6]"
          href="/booking/new"
          onClick={onNavigate}
          style={{ left: "20px", bottom: "18px", height: "34px", padding: "0 14px", fontSize: "13px", color: "#524096" }}
        >
          Book now
          <svg fill="none" height={12} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24" width={12}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
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

  const firstName = profile.full_name.trim().split(/\s+/)[0] || "there";
  const backLink = appParentBackLink(pathname);

  async function logout() {
    setSigningOut(true);
    await createBrowserClient().auth.signOut();
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
        {/* Mobile chrome (drawer, header, bottom nav) — only mounted on mobile */}
        {!desktop ? (
          <>
            {/* Drawer backdrop */}
            {drawerOpen ? (
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={() => setDrawerOpen(false)}
                type="button"
              />
            ) : null}

            {/* Mobile drawer */}
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col bg-[#F3F4F6] shadow-2xl transition-transform duration-200 ease-out",
                drawerOpen ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <div className="flex items-center justify-between p-5">
                <span style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.025em", color: "#1E1848" }}>Mundoria</span>
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
                {signingOut ? "Signing out…" : "Log out"}
              </button>
            </aside>

            {/* Mobile sticky header */}
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
                  <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.025em", color: "#1E1848" }}>Mundoria</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <NotificationBell userId={profile.id} />
                  <UserAvatar
                    name={profile.full_name}
                    seed={profile.id}
                    size="sm"
                    url={profile.avatar_url}
                  />
                </div>
              </div>
            </header>
          </>
        ) : null}

        {/* Layout: desktop sidebar + main OR mobile content — children render exactly once */}
        {desktop ? (
          <div
            className="flex min-h-screen gap-5"
            style={{ padding: "20px", boxSizing: "border-box", maxWidth: "1600px", margin: "0 auto" }}
          >
            {/* Desktop sidebar */}
            <aside className="relative sticky top-5 h-[calc(100vh-40px)] min-h-[640px] w-[280px] shrink-0">
              <CustomerSidebarFull
                onLogout={() => void logout()}
                onNavigate={undefined}
                pathname={pathname}
                signingOut={signingOut}
              />
            </aside>

            {/* Desktop main */}
            <main className="flex min-w-0 flex-1 flex-col">
              {/* Page header: welcome block + profile card */}
              <div className="grid items-start gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                {/* Left: welcome */}
                <div
                  className="relative min-h-[118px] bg-[#F3F4F6] px-5 pb-5 pt-6 flex flex-col gap-1.5"
                  style={{ borderRadius: "22px 22px 0 0" }}
                >
                  {backLink ? (
                    <DashboardBackLink
                      className="mb-1"
                      href={backLink.href}
                      label={backLink.label}
                    />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <h1 className="m-0 text-[34.7px] font-semibold leading-[40px] tracking-[-0.02em] text-[#000]">
                        Welcome back {firstName}
                      </h1>
                      <span aria-label="wave" role="img" style={{ fontSize: "30px", lineHeight: 1 }}>👋</span>
                    </div>
                  )}
                  <p className="m-0 max-w-xl text-[18px] leading-[21px] text-[#5F5F66]">
                    Keep track of your cleaning services, upcoming bookings, and past appointments.
                  </p>
                  {/* Concave corner */}
                  <div
                    className="pointer-events-none absolute bottom-0 right-[-22px] h-[22px] w-[22px]"
                    style={{ background: "radial-gradient(circle at 100% 0, transparent 21.5px, #F3F4F6 22px)" }}
                  />
                </div>

                {/* Right: profile card */}
                <div
                  className="flex h-[98px] shrink-0 items-center gap-[19px] rounded-[22px] bg-[#F3F4F6]"
                  style={{ padding: "0 21px" }}
                >
                  <NotificationBell userId={profile.id} />
                  <UserAvatar
                    className="shrink-0"
                    name={profile.full_name}
                    seed={profile.id}
                    size="md"
                    url={profile.avatar_url}
                  />
                  <div className="flex flex-col gap-[3px]">
                    <span className="text-[17.4px] font-semibold leading-5 text-[#000] whitespace-nowrap">
                      {profile.full_name}
                    </span>
                    <span className="text-[17.4px] leading-5 text-[#5F5F66] whitespace-nowrap">
                      {profile.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content area */}
              <div
                className="flex-1 p-5"
                style={{ background: "#F3F4F6", borderRadius: "0 22px 22px 22px" }}
              >
                {children}
              </div>
            </main>
          </div>
        ) : (
          <div className="px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
            {backLink ? (
              <DashboardBackLink className="mb-4 -ml-1" href={backLink.href} label={backLink.label} />
            ) : null}
            {children}
          </div>
        )}

        {/* Mobile bottom nav */}
        {!desktop ? (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
            <div className="mx-auto grid h-16 max-w-lg" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                      active ? "text-[#524096]" : "text-[#8b8798]",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.6} />
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
