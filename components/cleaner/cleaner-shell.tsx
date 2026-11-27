"use client";

import {
  Award,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Gauge,
  LogOut,
  Menu,
  MessageCircle,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import {
  AccountMenu,
  CLEANER_ACCOUNT_MENU,
} from "@/components/shared/account-menu";
import {
  appParentBackLink,
  DashboardBackLink,
} from "@/components/shared/dashboard-back-link";
import { NotificationBell } from "@/components/shared/notification-bell";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";
import { isAwaitingApproval } from "@/lib/cleaner/approval";
import { formatInterviewSlot } from "@/lib/cleaner/interview-slots";
import { applicationLifecycleLabel } from "@/lib/cleaner/onboarding-compliance";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";

const NAV_ITEMS = [
  { exact: true, href: "/cleaner/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/cleaner/jobs", icon: BriefcaseBusiness, label: "Jobs" },
  { href: "/cleaner/diary", icon: CalendarDays, label: "Diary" },
  { href: "/cleaner/earnings", icon: Banknote, label: "Earnings" },
  { href: "/cleaner/performance", icon: Award, label: "Performance" },
  { href: "/cleaner/incidents", icon: ShieldAlert, label: "Incidents" },
  { href: "/cleaner/messages", icon: MessageCircle, label: "Messages" },
  { href: "/cleaner/profile", icon: UserRound, label: "Account" },
] as const;

const APPLICANT_NAV = [
  { exact: true, href: "/cleaner/dashboard", icon: Gauge, label: "Application" },
  { href: "/cleaner/messages", icon: MessageCircle, label: "Messages" },
  { href: "/cleaner/incidents", icon: ShieldAlert, label: "Incidents" },
  { href: "/cleaner/profile", icon: UserRound, label: "Account" },
] as const;

const PAGE_COPY: Record<
  string,
  { subtitle: string; title: string }
> = {
  "/cleaner/diary": {
    subtitle: "Your availability, booked sessions and day plan.",
    title: "Diary",
  },
  "/cleaner/earnings": {
    subtitle: "Payouts, weekly totals and payment history.",
    title: "Earnings",
  },
  "/cleaner/incidents": {
    subtitle: "Report issues and track open incidents.",
    title: "Incidents",
  },
  "/cleaner/jobs": {
    subtitle: "Offers, upcoming cleans and completed work.",
    title: "Jobs",
  },
  "/cleaner/messages": {
    subtitle: "Chats with customers on your matched jobs.",
    title: "Messages",
  },
  "/cleaner/performance": {
    subtitle: "Medallion progress, ratings and reliability.",
    title: "Performance",
  },
  "/cleaner/profile": {
    subtitle: "Your details, areas, services and account settings.",
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

function isActive(
  pathname: string,
  item: { exact?: boolean; href: string },
) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function pageContext(pathname: string, firstName: string) {
  if (pathname === "/cleaner/dashboard") {
    return {
      /** Short label for the mobile sticky bar — welcome stays in page content. */
      navTitle: "Dashboard",
      showTitle: true,
      showWave: true,
      subtitle:
        "Offers, today's cleans, earnings and medallion progress in one place.",
      title: `Welcome back, ${firstName}!`,
    };
  }
  // Job detail — require a segment after /job/ so /cleaner/jobs is not matched.
  // Title lives in the page SectionBanner (service name), so the shell stays light.
  if (/^\/cleaner\/job\/[^/]+/.test(pathname)) {
    return {
      navTitle: null,
      showTitle: false,
      showWave: false,
      subtitle: "Checklist, timing, customer details and payout for this visit.",
      title: "Job",
    };
  }
  if (/^\/cleaner\/messages\/[^/]+/.test(pathname)) {
    return {
      navTitle: null,
      showTitle: true,
      showWave: false,
      subtitle: "Message the customer about this job.",
      title: "Conversation",
    };
  }
  // Job detail keeps its own service banner; list tabs use the shell title + description.
  const exact = PAGE_COPY[pathname];
  if (exact) {
    return { navTitle: null, showTitle: true, showWave: false, ...exact };
  }
  return {
    navTitle: null,
    showTitle: true,
    showWave: false,
    subtitle: "Manage your Mundoria cleaner account.",
    title: "Cleaner",
  };
}

function CleanerSidebarFull({
  awaiting,
  onLogout,
  onNavigate,
  pathname,
  signingOut,
}: {
  awaiting: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  pathname: string;
  signingOut: boolean;
}) {
  const items = awaiting ? APPLICANT_NAV : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-[#F3F4F6] px-6 py-8">
      <span className="select-none text-[21px] font-bold tracking-[-0.025em] text-[#1E1848]">
        Mundoria
      </span>
      <p className="m-0 mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#524096]/70">
        Cleaner
      </p>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {items.map((item) => {
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

      {!awaiting ? (
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
            Next up
          </p>
          <p className="relative mt-1.5 m-0 text-[15px] font-bold leading-5 text-white">
            Check open jobs
          </p>
          <Link
            className="relative mt-4 inline-flex h-[34px] items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6]"
            href="/cleaner/jobs"
            onClick={onNavigate}
          >
            View jobs
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
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function CleanerShell({
  children,
  cleaner,
  profile,
}: {
  children: React.ReactNode;
  cleaner: CleanerProfile;
  profile: Profile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const desktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const awaiting = isAwaitingApproval(cleaner);
  const navItems = awaiting ? APPLICANT_NAV : NAV_ITEMS;
  const rawFirst = profile.full_name.trim().split(/\s+/)[0] || "there";
  const firstName =
    rawFirst.charAt(0).toLocaleUpperCase("en-GB") + rawFirst.slice(1);
  const backLink = appParentBackLink(pathname);
  const { navTitle, showTitle, showWave, subtitle, title } = pageContext(
    pathname,
    firstName,
  );
  const mobileBarTitle = navTitle ?? title;

  async function logout() {
    setSigningOut(true);
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

  const accountBanner =
    cleaner.status !== "certified" &&
    cleaner.status !== "active" &&
    !awaiting ? (
      <CleanerAccountBanner cleaner={cleaner} />
    ) : null;

  return (
    <>
      <SessionTimeoutGuard audience="cleaner" />
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
                <div>
                  <span className="text-[19px] font-bold tracking-[-0.025em] text-[#1E1848]">
                    Mundoria
                  </span>
                  <p className="m-0 mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#524096]/70">
                    Cleaner
                  </p>
                </div>
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
                {navItems.map((item) => {
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
                    {mobileBarTitle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <NotificationBell userId={profile.id} />
                  <AccountMenu
                    items={CLEANER_ACCOUNT_MENU}
                    profile={profile}
                    tier={awaiting ? null : cleaner.tier}
                  />
                </div>
              </div>
            </header>
          </>
        ) : null}

        {desktop ? (
          <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-5">
            <aside className="sticky top-5 h-[calc(100vh-40px)] w-[280px] shrink-0">
              <CleanerSidebarFull
                awaiting={awaiting}
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
                  {showTitle ? (
                    <div className="flex items-center gap-2.5">
                      <h1 className="m-0 text-[34.7px] font-semibold leading-[40px] tracking-[-0.02em] text-[#000]">
                        {title}
                      </h1>
                      {showWave ? (
                        <span
                          aria-label="wave"
                          className="text-[30px] leading-none"
                          role="img"
                        >
                          👋
                        </span>
                      ) : null}
                    </div>
                  ) : null}
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
                    items={CLEANER_ACCOUNT_MENU}
                    profile={profile}
                    tier={awaiting ? null : cleaner.tier}
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
                {accountBanner}
                {children}
              </div>
            </main>
          </div>
        ) : (
          <div className="min-h-[calc(100vh-3.5rem)] bg-[#F3F4F6] px-3 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-5">
            {backLink ? (
              <DashboardBackLink
                className="mb-3 -ml-1"
                href={backLink.href}
                label={backLink.label}
              />
            ) : showWave ? (
              <div className="mb-4">
                <h1 className="m-0 flex items-center gap-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#1E1848]">
                  {title}
                  <span aria-label="wave" className="text-[22px] leading-none" role="img">
                    👋
                  </span>
                </h1>
                <p className="m-0 mt-1.5 text-[14px] leading-5 text-[#5F5F66]">
                  {subtitle}
                </p>
              </div>
            ) : (
              <p className="mb-4 m-0 text-[14px] leading-5 text-[#5F5F66]">
                {subtitle}
              </p>
            )}
            {accountBanner}
            {children}
          </div>
        )}

      </div>
    </>
  );
}

function CleanerAccountBanner({ cleaner }: { cleaner: CleanerProfile }) {
  if (cleaner.status === "pending" || cleaner.status === "in_training") {
    const awaitingInterview = cleaner.interview_status === "awaiting";
    const interviewFailed = cleaner.interview_status === "failed";
    const lifecycle = applicationLifecycleLabel(cleaner);
    const title = interviewFailed
      ? "Onboarding call needs a follow-up"
      : awaitingInterview
        ? "Onboarding call coming up"
        : cleaner.status === "in_training"
          ? "Action required"
          : lifecycle === "Action Required"
            ? "Action required"
            : "Application under review";
    const body = interviewFailed
      ? "Your onboarding call didn’t lead to approval this time. Mundoria will follow up with next steps. You can still update your profile."
      : awaitingInterview
        ? cleaner.interview_scheduled_at
          ? `Your 30-minute onboarding call is booked for ${formatInterviewSlot(cleaner.interview_scheduled_at)}. We’ll use the phone number on your profile.`
          : "Thanks for submitting. Keep your appointment free - we’ll use the phone number on your profile."
        : cleaner.status === "in_training"
          ? "Mundoria has put your application on hold. You can still update your profile. Job offers appear after you’re approved."
          : "You can explore your dashboard and update your profile. New job offers will appear after Mundoria approves your application. Payout setup opens on your dashboard once you’re approved.";

    return (
      <div className="mb-4 rounded-[18px] bg-white p-5 text-[#1E1848] sm:mb-5">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#524096]" />
          <div>
            <p className="m-0 font-semibold">{title}</p>
            <p className="m-0 mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#524096]/70">
              Status: {lifecycle}
            </p>
            <p className="m-0 mt-1.5 text-[14px] leading-5 text-[#5F5F66]">
              {body}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[18px] border border-destructive/30 bg-destructive/10 p-5 text-destructive sm:mb-5">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="m-0 font-semibold">
            Account {applicationLifecycleLabel(cleaner)}
          </p>
          <p className="m-0 mt-1 text-[14px]">
            Your cleaner account cannot receive job offers right now. Contact
            Mundoria support if you think this is a mistake.
          </p>
        </div>
      </div>
    </div>
  );
}
