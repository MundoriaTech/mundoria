import type { Metadata } from "next";

import { CrmLink } from "@/components/analytics/crm-link";
import { CrmPageView } from "@/components/analytics/crm-page-view";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/customer";

export const metadata: Metadata = { title: "Dashboard" };

function HomeIcon() {
  return (
    <svg fill="none" height={40} stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={40}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function OfficeIcon() {
  return (
    <svg fill="none" height={40} stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={40}>
      <rect height="20" rx="2" width="16" x="4" y="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01" strokeWidth={2.5} />
    </svg>
  );
}
function EventIcon() {
  return (
    <svg fill="none" height={40} stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={40}>
      <path d="M5.8 11.3 2 22l10.4-3.8M2 22l6.4-6.4" />
      <path d="M15.4 15 11 10.6l8.3-8.3a2.1 2.1 0 1 1 3 3L15.4 15Z" />
      <path d="M2 11.5a10 10 0 0 1 10-10" />
      <path d="M12.5 22a10 10 0 0 0 10-10" />
    </svg>
  );
}

const SERVICES = [
  {
    Icon: HomeIcon,
    bg: "linear-gradient(145deg,#524096 0%,#7262A9 100%)",
    href: "/booking/new?fresh=1&service=regular&returnTo=/dashboard",
    label: "Home",
  },
  {
    Icon: OfficeIcon,
    bg: "linear-gradient(145deg,#1E1848 0%,#3B3480 100%)",
    href: "/booking/new?fresh=1&service=office&returnTo=/dashboard",
    label: "Office",
  },
  {
    Icon: EventIcon,
    bg: "linear-gradient(145deg,#B85C38 0%,#D47848 100%)",
    href: "/booking/new?fresh=1&service=one_off&returnTo=/dashboard",
    label: "One-off",
  },
] as const;

function TimeTile({ booking }: { booking: Booking | null }) {
  const time = booking?.scheduled_start_time?.slice(0, 5) ?? null;
  const hours = time ? parseInt(time.split(":")[0]!, 10) : null;
  const minutes = time ? parseInt(time.split(":")[1]!, 10) : null;
  const hasTime = hours !== null && minutes !== null;
  const totalMinutes = hasTime ? hours * 60 + minutes : null;
  const progress = totalMinutes !== null ? totalMinutes / (24 * 60) : 0;

  const C = 2 * Math.PI * 73;
  const L = C * progress;

  const h = hasTime ? hours % 12 || 12 : null;
  const m = hasTime ? String(minutes).padStart(2, "0") : null;
  const ampm = hasTime ? (hours >= 12 ? "PM" : "AM") : null;

  return (
    <div
      className="relative h-[238px] rounded-[18px] bg-[#F3F4F6]"
      style={{ minWidth: "240px", flex: "1 1 240px" }}
    >
      <p className="absolute left-5 top-5 m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
        Arrival time
      </p>
      {hasTime ? (
        <>
          <svg
            className="absolute"
            height={180}
            style={{ left: "50%", top: "29px", transform: "translateX(-50%)" }}
            viewBox="0 0 180 180"
            width={180}
          >
            <circle
              cx="90"
              cy="90"
              fill="none"
              r="73"
              stroke="#2A2A2E"
              strokeDasharray="1.6 5.1"
              strokeWidth="9"
              transform="rotate(-90 90 90)"
            />
            <circle
              cx="90"
              cy="90"
              fill="none"
              r="73"
              stroke="#F3F4F6"
              strokeDasharray={`${L + 6} ${C}`}
              strokeWidth="12"
              transform="rotate(-90 90 90)"
            />
            <circle
              cx="90"
              cy="90"
              fill="none"
              r="73"
              stroke="#7262A9"
              strokeDasharray={`${L} ${C}`}
              strokeLinecap="round"
              strokeWidth="18"
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div
            className="absolute left-0 right-0 flex items-baseline justify-center gap-[2px]"
            style={{ top: "105px" }}
          >
            <span
              style={{
                fontSize: "28.8px",
                lineHeight: "30px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {h}:{m}
            </span>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{ampm}</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-x-5 top-[100px] text-center">
          <p className="m-0 text-[17px] font-semibold text-[#5F5F66]">
            No upcoming session
          </p>
          <p className="mt-2 m-0 text-[13px] text-[#8b8798]">
            Book a clean to see your arrival time
          </p>
        </div>
      )}
    </div>
  );
}

function LocationTile({ booking }: { booking: Booking | null }) {
  const city = booking?.address?.city ?? null;
  const line1 = booking?.address?.address_line_1 ?? null;
  const postcode = booking?.address?.postcode ?? null;
  const hasAddress = !!(line1 || city);

  return (
    <div
      className="relative h-[238px] overflow-hidden rounded-[18px]"
      style={{ minWidth: "240px", flex: "1 1 240px", background: "#1E1848" }}
    >
      {/* dot-grid background */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* glow */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ width: "200px", height: "200px", left: "-40px", top: "-60px", background: "radial-gradient(circle,rgba(130,113,177,0.35) 0%,transparent 70%)" }}
      />

      {/* decorative location pin */}
      <svg
        className="absolute opacity-10"
        fill="none"
        height={120}
        style={{ right: "-18px", bottom: "-18px" }}
        viewBox="0 0 100 120"
        width={100}
      >
        <path d="M50 10C31.2 10 16 25.2 16 44c0 24 34 66 34 66s34-42 34-66c0-18.8-15.2-34-34-34z" fill="#ffffff" />
        <circle cx="50" cy="44" fill="#1E1848" r="13" />
      </svg>

      {/* content */}
      <div className="absolute left-5 right-5" style={{ top: "32px" }}>
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-[6px]"
            style={{ width: "24px", height: "24px", background: "rgba(255,255,255,0.12)" }}
          >
            <svg fill="none" height={14} stroke="#C69C66" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C69C66" }}>Service location</span>
        </div>

        {hasAddress ? (
          <div>
            {line1 && (
              <p style={{ fontSize: "17.4px", fontWeight: 700, color: "#FFFFFF", lineHeight: "20px", letterSpacing: "-0.01em", margin: 0 }}>{line1}</p>
            )}
            {postcode && (
              <p style={{ fontSize: "17.4px", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: "22px", margin: 0 }}>{postcode}</p>
            )}
            {city && (
              <div
                className="mt-3 inline-flex items-center gap-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 12px 5px 8px" }}
              >
                <span className="rounded-full bg-[#524096]" style={{ width: "6px", height: "6px", flexShrink: 0 }} />
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{city}</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "17.4px", fontWeight: 700, color: "rgba(255,255,255,0.4)", lineHeight: "22px", margin: 0 }}>No address set</p>
            <a
              href="/addresses"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13.5px", fontWeight: 600, color: "#C69C66", textDecoration: "none" }}
            >
              Add a location
              <svg fill="none" height={14} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  const Icon = service.Icon;
  return (
    <CrmLink
      className="group relative block min-w-[min(100%,280px)] shrink-0 overflow-hidden rounded-[14px] transition hover:brightness-110 sm:min-w-[300px]"
      crmEvent="recommendation_click"
      crmPayload={{
        action: "Book now",
        item: service.label,
        service: service.label,
      }}
      href={service.href}
      style={{ height: "220px", flex: "1 1 280px", maxWidth: "360px", background: service.bg, boxSizing: "border-box" }}
    >
      {/* Subtle radial highlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 15% 15%,rgba(255,255,255,0.14) 0%,transparent 55%)" }}
      />
      {/* Dot-grid texture */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern height="22" id={`dot-${service.label}`} patternUnits="userSpaceOnUse" width="22">
            <circle cx="2" cy="2" fill="white" r="1.5" />
          </pattern>
        </defs>
        <rect fill={`url(#dot-${service.label})`} height="100%" width="100%" />
      </svg>
      {/* Large decorative icon */}
      <div
        className="pointer-events-none absolute opacity-[0.13]"
        style={{ right: "-20px", bottom: "-20px", transform: "scale(3.6)", transformOrigin: "right bottom" }}
      >
        <Icon />
      </div>
      {/* Top badge */}
      <div
        className="absolute left-0 top-0 flex items-center gap-3"
        style={{ height: "52px", paddingLeft: "18px", paddingRight: "24px", background: "rgba(0,0,0,0.22)", backdropFilter: "blur(6px)", borderRadius: "0 0 14px 0", boxSizing: "border-box" }}
      >
        <Icon />
        <span style={{ fontSize: "17.4px", fontWeight: 700, color: "#FFFFFF" }}>{service.label}</span>
      </div>
      {/* Bottom CTA strip */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-10"
        style={{ background: "linear-gradient(0deg,rgba(0,0,0,0.38) 0%,transparent 100%)" }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Book now →</span>
      </div>
    </CrmLink>
  );
}

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const bookings = await getCustomerBookings(supabase, user!.id);
  const now = new Date();
  const upcoming = bookings
    .filter(
      (b) =>
        !["completed", "cancelled"].includes(b.status) &&
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`) >= now,
    )
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const next = upcoming[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <CrmPageView customerId={user!.id} event="dashboard_view" />
      <LiveDashboardRefresh
        scope={`customer-dashboard-${user!.id}`}
        watches={bookingWatchesFor("customer")}
      />

      {/* Upcoming Cleaning */}
      <section className="flex flex-col gap-5 rounded-[22px] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div
            className="relative flex h-[70px] flex-1 items-center overflow-hidden rounded-[14px] px-6"
            style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
            />
            <h2
              className="relative m-0 font-semibold leading-none text-white"
              style={{ fontSize: "22.8px", letterSpacing: "-0.01em" }}
            >
              Upcoming Cleaning
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <CrmLink
              className="flex items-center justify-center gap-3 rounded-full font-semibold text-white transition"
              crmEvent="book_session_click"
              crmPayload={{ action: "Book a Session", customer_id: user!.id }}
              href="/booking/new?fresh=1&returnTo=/dashboard"
              style={{
                height: "57px",
                padding: "0 24px",
                fontSize: "17.4px",
                background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                whiteSpace: "nowrap",
              }}
            >
              <svg fill="none" height={24} stroke="#fff" strokeLinecap="round" strokeWidth={1.8} viewBox="0 0 24 24" width={24}>
                <path d="M5 12h14M12 5v14" />
              </svg>
              Book a Session
            </CrmLink>
            <CrmLink
              className="flex items-center justify-center gap-3 rounded-full font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
              crmEvent="view_sessions_click"
              crmPayload={{ action: "View Sessions", customer_id: user!.id }}
              href="/bookings"
              style={{ height: "57px", padding: "0 24px", fontSize: "17.4px", border: "2px solid #524096", whiteSpace: "nowrap" }}
            >
              <svg fill="none" height={26} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} viewBox="0 0 24 24" width={26}>
                <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
                <circle cx="16" cy="16" r="6" />
                <path d="M17.5 17.5 16 16.3V14" />
              </svg>
              View Sessions
            </CrmLink>
            {next ? (
              <CrmLink
                className="flex items-center justify-center gap-3 rounded-full font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
                crmEvent="booking_request_view"
                crmPayload={{
                  action: "View request",
                  booking_amount:
                    typeof next.amount_total === "number"
                      ? next.amount_total / 100
                      : null,
                  booking_currency: "GBP",
                  booking_datetime: `${next.scheduled_date}T${next.scheduled_start_time}`,
                  booking_id: next.id,
                  customer_id: user!.id,
                  service: next.service_type,
                  service_location:
                    [
                      next.address?.address_line_1,
                      next.address?.city,
                      next.address?.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ") || null,
                }}
                href={`/booking/${next.id}`}
                style={{ height: "57px", padding: "0 24px", fontSize: "17.4px", border: "2px solid #524096", whiteSpace: "nowrap" }}
              >
                View request
              </CrmLink>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <CalendarTile booking={next} />
          <TimeTile booking={next} />
          <LocationTile booking={next} />
        </div>
      </section>

      {/* Popular Services */}
      <section className="flex flex-col gap-5 rounded-[22px] bg-white p-5">
        <div
          className="relative flex h-[70px] items-center overflow-hidden rounded-[14px] px-6"
          style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
          />
          <h2
            className="relative m-0 font-semibold leading-none text-white"
            style={{ fontSize: "22.8px", letterSpacing: "-0.01em" }}
          >
            Popular Services
          </h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.label} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
