"use client";

import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  FileCheck2,
  Gauge,
  Inbox,
  LogOut,
  MailWarning,
  MapPinned,
  Menu,
  MessageSquare,
  Newspaper,
  Percent,
  Megaphone,
  PhoneCall,
  Settings,
  ShieldAlert,
  Target,
  UserSearch,
  Users,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AdminBackLink,
  adminParentBackLink,
} from "@/components/admin/admin-back-link";
import { AdminAlerts } from "@/components/admin/admin-alerts";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  adminOpsWatches,
  OPS_REFRESH_MS,
} from "@/lib/dashboard/live-refresh";
import { createBrowserClient } from "@/lib/supabase/client";
import type { AdminAccess, AdminArea } from "@/lib/admin/access";
import { useFeedback } from "@/components/shared/feedback-provider";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";

type NavItem = {
  /** Only shown to admins with access to this section. */
  area?: AdminArea;
  href: string;
  icon: LucideIcon;
  label: string;
  match?: (pathname: string) => boolean;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operations",
    items: [
      { href: "/admin/dashboard", icon: Gauge, label: "Dashboard" },
      {
        href: "/admin/matching",
        icon: UserSearch,
        label: "Matching",
        match: (p) => p === "/admin/matching" || p.startsWith("/admin/matching/"),
      },
      { href: "/admin/bookings", icon: BookOpenCheck, label: "Bookings" },
      {
        area: "leads",
        href: "/admin/leads",
        icon: Target,
        label: "Leads",
        match: (p) => p === "/admin/leads" || p.startsWith("/admin/leads/"),
      },
      {
        href: "/admin/abandoned-bookings",
        icon: MailWarning,
        label: "Abandoned bookings",
        match: (p) => p === "/admin/abandoned-bookings" || p.startsWith("/admin/abandoned-bookings/"),
      },
      {
        area: "callback_leads",
        href: "/admin/callback-leads",
        icon: PhoneCall,
        label: "Callback leads",
        match: (p) =>
          p === "/admin/callback-leads" || p.startsWith("/admin/callback-leads/"),
      },
      {
        area: "meta_leads",
        href: "/admin/meta-leads",
        icon: Megaphone,
        label: "Meta 20% leads",
        match: (p) => p === "/admin/meta-leads" || p.startsWith("/admin/meta-leads/"),
      },
      {
        href: "/admin/inbox",
        icon: Inbox,
        label: "Inbox",
        match: (p) => p === "/admin/inbox" || p.startsWith("/admin/inbox/"),
      },
      { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
      {
        href: "/admin/safety",
        icon: ShieldAlert,
        label: "Safety",
        match: (p) => p === "/admin/safety" || p.startsWith("/admin/safety/"),
      },
      {
        href: "/admin/incidents",
        icon: AlertTriangle,
        label: "Incidents",
        match: (p) => p === "/admin/incidents" || p.startsWith("/admin/incidents/"),
      },
      { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/admin/cleaners",
        icon: UsersRound,
        label: "Cleaners",
        match: (p) =>
          p === "/admin/cleaners" ||
          p.startsWith("/admin/cleaners/") ||
          p.startsWith("/admin/cleaner/"),
      },
      {
        href: "/admin/customers",
        icon: UserRound,
        label: "Customers",
        match: (p) =>
          p === "/admin/customers" || p.startsWith("/admin/customer/"),
      },
      {
        href: "/admin/verification",
        icon: FileCheck2,
        label: "Verification",
        match: (p) => p === "/admin/verification" || p.startsWith("/admin/verification/"),
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

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const PAGE_SUBTITLES: Record<string, string> = {
  "/admin/dashboard": "Jobs running today, cleaners waiting for review, and money coming in.",
  "/admin/matching": "Bookings that need a cleaner, a chase, or a human on the desk.",
  "/admin/bookings": "Search, inspect, and resolve booking edge cases.",
  "/admin/abandoned-bookings": "Leads who started the booking flow but didn't complete it.",
  "/admin/callback-leads": "Ads callbacks. Filter To call when you sit down to ring; All is the full list.",
  "/admin/meta-leads": "Callback requests from the Meta 20% off page, with campaign results.",
  "/admin/leads": "Every prospect, their follow-ups, AI replies and calls, and who needs a person.",
  "/admin/leads/reports": "Weekly lead automation reports.",
  "/admin/inbox": "Support conversations with customers and cleaners.",
  "/admin/disputes": "Manage and resolve booking disputes.",
  "/admin/safety": "Track and resolve safety incidents and SOS alerts.",
  "/admin/incidents": "Manage in-session incidents and reports.",
  "/admin/feedback": "Collected ratings and written feedback.",
  "/admin/cleaners": "Review, approve, and manage cleaning professionals.",
  "/admin/customers": "Browse and manage customer accounts.",
  "/admin/verification": "Review identity and right-to-work documents.",
  "/admin/team": "Manage admin access and permissions.",
  "/admin/payouts": "Process and track cleaner payouts.",
  "/admin/promos": "Create and manage promotional codes.",
  "/admin/zones": "Define and edit coverage zones.",
  "/admin/mag": "Publish articles and tips on the Mundoria blog.",
  "/admin/settings": "Configure platform-wide settings.",
};

function isActive(pathname: string, item: NavItem) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function pageTitle(pathname: string) {
  if (pathname === "/admin/dashboard") return "Operations desk";
  const match = ALL_ITEMS.find((item) => isActive(pathname, item));
  if (match) {
    if (match.href === "/admin/mag" && pathname !== "/admin/mag") {
      return pathname.includes("/new") ? "New Mag post" : "Edit Mag post";
    }
    if (match.href === "/admin/cleaners" && pathname !== "/admin/cleaners") return "Cleaner";
    if (match.href === "/admin/customers" && pathname !== "/admin/customers") return "Customer";
    if (match.href === "/admin/bookings" && pathname.startsWith("/admin/booking/")) return "Booking";
    if (match.href === "/admin/disputes" && pathname !== "/admin/disputes") return "Dispute";
    if (match.href === "/admin/incidents" && pathname !== "/admin/incidents") return "Incident";
    if (match.href === "/admin/safety" && pathname !== "/admin/safety") return "Safety case";
    if (match.href === "/admin/inbox" && pathname !== "/admin/inbox") return "Conversation";
    if (match.href === "/admin/leads" && pathname === "/admin/leads/reports") return "Lead reports";
    if (match.href === "/admin/leads" && pathname !== "/admin/leads") return "Lead";
    if (
      match.href === "/admin/callback-leads" &&
      pathname !== "/admin/callback-leads"
    ) {
      return "Callback lead";
    }
    return match.label;
  }
  if (pathname.startsWith("/admin/booking/")) return "Booking";
  return "Admin";
}

function pageEyebrow(pathname: string) {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => isActive(pathname, item))) {
      return group.label.toUpperCase();
    }
  }
  return "OPERATIONS";
}

function pageSubtitle(pathname: string) {
  // List pages only: a detail page (e.g. one callback) shouldn't repeat the
  // list's instructions ("Filter To call when you sit down to ring…").
  return PAGE_SUBTITLES[pathname.replace(/\/$/, "")] ?? "";
}

function SidebarNav({
  access,
  collapsed,
  onNavigate,
  pathname,
}: {
  access: AdminAccess;
  collapsed: boolean;
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav
      className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-2"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex flex-col gap-[18px] pb-4">
        {NAV_GROUPS.map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.area || access[item.area]),
        })).map((group) => (
          <div className="flex flex-col gap-[2px]" key={group.label}>
            {collapsed ? (
              <span className="mx-7 mb-2 h-px bg-[#E1E1EA]" />
            ) : (
              <span
                className="pb-1.5 pl-[30px] text-[12.3px] font-semibold tracking-[0.12em] text-[#8A8A92] whitespace-nowrap"
              >
                {group.label.toUpperCase()}
              </span>
            )}
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "relative flex h-[42px] items-center gap-[14px] whitespace-nowrap text-[17.4px] transition-colors",
                    collapsed ? "justify-center px-0" : "px-[30px]",
                    active ? "font-semibold text-[#000]" : "font-medium text-[#6B6B70] hover:text-[#000]",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className="absolute left-0 top-[7px] w-2 rounded-r-lg transition-colors"
                    style={{
                      height: "28px",
                      background: active ? "#5B5098" : "transparent",
                    }}
                  />
                  <Icon
                    className="h-[22px] w-[22px] shrink-0"
                    strokeWidth={1.7}
                    style={{ color: active ? "#524096" : "#6B6B70" }}
                  />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

function SidebarFooter({
  admin,
  collapsed,
  onNavigate,
  signingOut,
  onLogout,
}: {
  admin: Profile;
  collapsed: boolean;
  onNavigate?: () => void;
  signingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div
      className="flex shrink-0 flex-col gap-3"
      style={{ padding: collapsed ? "16px 14px 20px" : "16px 20px 20px" }}
    >
      <Link
        className="flex items-center justify-center gap-3 rounded-[14px] bg-white transition hover:bg-white/80"
        href="/admin/team"
        onClick={onNavigate}
        style={{ padding: collapsed ? "8px" : "12px 14px" }}
      >
        <UserAvatar
          className="shrink-0"
          name={admin.full_name}
          preview={false}
          seed={admin.id}
          size="sm"
          url={admin.avatar_url}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#000]">
              {admin.full_name}
            </p>
            <p className="truncate text-[13.5px] text-[#5F5F66]">{admin.email}</p>
          </div>
        )}
      </Link>
      <button
        className="flex h-[44px] items-center justify-center gap-[10px] whitespace-nowrap rounded-full border-2 border-[#524096] text-[15px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
        disabled={signingOut}
        onClick={onLogout}
        type="button"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
        {!collapsed && (signingOut ? "Signing out…" : "Log out")}
      </button>
    </div>
  );
}

export function AdminShell({
  access,
  admin,
  children,
  notifications,
}: {
  access: AdminAccess;
  admin: Profile;
  children: React.ReactNode;
  notifications: Notification[];
}) {
  const { confirm } = useFeedback();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const title = pageTitle(pathname);
  const eyebrow = pageEyebrow(pathname);
  const subtitle = pageSubtitle(pathname);
  const backLink = adminParentBackLink(pathname);
  const isMagEditor = pathname.startsWith("/admin/mag/") && pathname !== "/admin/mag";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mdAdminSidebar");
      if (saved) setCollapsed(saved === "collapsed");
    } catch {}
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("mdAdminSidebar", next ? "collapsed" : "expanded");
    } catch {}
  }

  async function logout() {
    const confirmed = await confirm({
      action: "Log out",
      description: "You will need to sign in again to see your account.",
      title: "Log out of Mundoria?",
      variant: "destructive",
    });
    if (!confirmed) return;
    setSigningOut(true);
    await createBrowserClient().auth.signOut();
    clearPersonalBrowserData();
    router.replace("/admin/login");
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

  const firstName = admin.full_name.trim().split(/\s+/)[0] || "Admin";
  const sidebarWidth = collapsed ? 88 : 280;

  const sidebarContent = (inDrawer = false) => (
    <>
      {/* Logo row */}
      <div
        className="flex shrink-0 items-center justify-between gap-3.5"
        style={{
          padding: collapsed && !inDrawer ? "28px 0 8px" : "28px 20px 8px",
          flexDirection: collapsed && !inDrawer ? "column" : "row",
          alignItems: collapsed && !inDrawer ? "center" : "flex-start",
        }}
      >
        {!collapsed || inDrawer ? (
          <div className="flex flex-col gap-2 min-w-0">
            <Image
              alt="Mundoria"
              className="self-start"
              height={30}
              src="/images/dashboard/mundoria-lockup-horizontal.png"
              style={{ width: "auto", height: "30px" }}
              width={120}
            />
            <span className="text-[12.3px] font-semibold tracking-[0.16em] text-[#C69C66]">
              OPERATIONS
            </span>
          </div>
        ) : (
          <Image
            alt="Mundoria"
            height={36}
            src="/images/dashboard/mundoria-mark.png"
            style={{ width: "36px", height: "auto" }}
            width={36}
          />
        )}
        {!inDrawer ? (
          <button
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-none bg-white transition hover:bg-[#ECE8F6]"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            <svg
              fill="none"
              height={16}
              stroke="#524096"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
              viewBox="0 0 24 24"
              width={16}
            >
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
        ) : (
          <button
            aria-label="Close menu"
            className="rounded-full p-2 text-[#6B6B70] hover:bg-black/5 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <SidebarNav
        access={access}
        collapsed={collapsed && !inDrawer}
        onNavigate={inDrawer ? () => setDrawerOpen(false) : undefined}
        pathname={pathname}
      />

      <SidebarFooter
        admin={admin}
        collapsed={collapsed && !inDrawer}
        onLogout={() => void logout()}
        onNavigate={inDrawer ? () => setDrawerOpen(false) : undefined}
        signingOut={signingOut}
      />
    </>
  );

  return (
    <div
      className="min-h-screen bg-white text-[#000]"
      style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}
    >
      <SessionTimeoutGuard audience="admin" />
      <LiveDashboardRefresh
        intervalMs={OPS_REFRESH_MS}
        scope={`admin-shell-${admin.id}`}
        watches={adminOpsWatches()}
      />

      {/* Mobile drawer backdrop */}
      {drawerOpen ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#1c133b]/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
          type="button"
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col bg-[#F3F4F6] shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* Mobile sticky header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
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
            {backLink ? (
              <AdminBackLink className="min-h-0 py-0 text-xs" href={backLink.href} label={backLink.label} />
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C69C66]">
                {eyebrow}
              </p>
            )}
            <p className="truncate text-sm font-semibold text-[#000]">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <AdminAlerts initialNotifications={notifications} userId={admin.id} />
            <Link
              className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-[#F3F4F6]"
              href="/admin/team"
            >
              <UserAvatar
                name={admin.full_name}
                preview={false}
                seed={admin.id}
                size="sm"
                url={admin.avatar_url}
              />
              <span className="hidden max-w-[7rem] truncate text-sm font-medium sm:inline">
                {firstName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div
        className="hidden min-h-screen gap-5 lg:flex"
        style={{ padding: "20px", boxSizing: "border-box", maxWidth: "1600px", margin: "0 auto" }}
      >
        {/* Desktop sidebar */}
        <aside
          className="sticky top-5 flex shrink-0 flex-col overflow-hidden rounded-[22px] bg-[#F3F4F6] transition-all duration-200"
          style={{
            width: `${sidebarWidth}px`,
            height: "calc(100vh - 40px)",
            minHeight: "640px",
          }}
        >
          {sidebarContent(false)}
        </aside>

        {/* Desktop main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Page header */}
          {!isMagEditor ? (
            <div className="grid items-start gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              {/* Left: eyebrow + title + subtitle */}
              <div
                className="relative min-h-[118px] rounded-t-[22px] bg-[#F3F4F6] px-5 py-6 flex flex-col gap-1.5"
                style={{ borderRadius: "22px 22px 0 0" }}
              >
                {backLink ? (
                  <AdminBackLink className="mb-1" href={backLink.href} label={backLink.label} />
                ) : (
                  <span className="text-[12.3px] font-semibold tracking-[0.16em] text-[#C69C66]">
                    {eyebrow}
                  </span>
                )}
                <h1 className="m-0 text-[34.7px] font-semibold leading-[40px] tracking-[-0.02em] text-[#000]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="m-0 max-w-xl text-[18px] leading-[23px] text-[#5F5F66]">
                    {subtitle}
                  </p>
                ) : null}
                {/* Concave corner */}
                <div
                  className="pointer-events-none absolute bottom-0 right-[-22px] h-[22px] w-[22px]"
                  style={{ background: "radial-gradient(circle at 100% 0, transparent 21.5px, #F3F4F6 22px)" }}
                />
              </div>
              {/* Right: notifications + avatar */}
              <div
                className="flex h-[98px] shrink-0 items-center gap-[19px] rounded-[22px] bg-[#F3F4F6]"
                style={{ padding: "0 24px 0 21px" }}
              >
                <AdminAlerts initialNotifications={notifications} userId={admin.id} />
                <UserAvatar
                  className="shrink-0"
                  name={admin.full_name}
                  seed={admin.id}
                  size="md"
                  url={admin.avatar_url}
                />
                <span className="text-[17.4px] font-semibold text-[#000] whitespace-nowrap">
                  {firstName}
                </span>
              </div>
            </div>
          ) : null}

          {/* Content area */}
          <div
            className={cn(
              "flex-1",
              isMagEditor
                ? ""
                : "bg-[#F3F4F6] p-5"
            )}
            style={!isMagEditor ? { borderRadius: "0 22px 22px 22px" } : undefined}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden px-3 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-7">
        {!isMagEditor && backLink ? (
          <AdminBackLink className="mb-4" href={backLink.href} label={backLink.label} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
