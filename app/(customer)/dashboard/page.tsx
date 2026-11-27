import type { Metadata } from "next";

import { CrmLink } from "@/components/analytics/crm-link";
import { CrmPageView } from "@/components/analytics/crm-page-view";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/customer";
import { CleanCountdown } from "@/components/shared/clean-countdown";

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
    <div className="flex h-full min-h-[210px] flex-col rounded-[18px] bg-[#F3F4F6] p-5">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
        Arrival time
      </p>
      {hasTime ? (
        <div className="relative mx-auto mt-2 aspect-square w-full max-w-[164px] flex-none">
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 180 180">
            <circle cx="90" cy="90" fill="none" r="73" stroke="#2A2A2E" strokeDasharray="1.6 5.1" strokeWidth="9" transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" fill="none" r="73" stroke="#F3F4F6" strokeDasharray={`${L + 6} ${C}`} strokeWidth="12" transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" fill="none" r="73" stroke="#7262A9" strokeDasharray={`${L} ${C}`} strokeLinecap="round" strokeWidth="18" transform="rotate(-90 90 90)" />
          </svg>
          <p className="absolute inset-0 m-0 flex items-center justify-center gap-[2px]">
            <span className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">
              {h}:{m}
            </span>
            <span className="text-[13px] font-semibold">{ampm}</span>
          </p>
        </div>
      ) : (
        <div className="my-auto text-center">
          <p className="m-0 text-[17px] font-semibold text-[#5F5F66]">No upcoming session</p>
          <p className="m-0 mt-2 text-[13px] text-[#6f6a82]">Book a clean to see your arrival time</p>
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
      className="relative flex h-full min-h-[210px] flex-col overflow-hidden rounded-[18px] p-5"
      style={{ background: "#1E1848" }}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: "200px", height: "200px", left: "-40px", top: "-60px", background: "radial-gradient(circle,rgba(130,113,177,0.35) 0%,transparent 70%)" }}
      />
      <svg aria-hidden className="absolute opacity-10" fill="none" height={120} style={{ right: "-18px", bottom: "-18px" }} viewBox="0 0 100 120" width={100}>
        <path d="M50 10C31.2 10 16 25.2 16 44c0 24 34 66 34 66s34-42 34-66c0-18.8-15.2-34-34-34z" fill="#ffffff" />
        <circle cx="50" cy="44" fill="#1E1848" r="13" />
      </svg>

      <div className="relative flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px]" style={{ background: "rgba(255,255,255,0.12)" }}>
          <svg fill="none" height={14} stroke="#C69C66" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C69C66]">Service location</span>
      </div>

      {hasAddress ? (
        <div className="relative mt-4 max-w-[90%]">
          {line1 ? (
            <p className="m-0 line-clamp-3 break-words text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-white">{line1}</p>
          ) : null}
          {postcode ? (
            <p className="m-0 mt-1 text-[16px] leading-[1.35] text-white/70">{postcode}</p>
          ) : null}
          {city ? (
            <span
              className="mt-3 inline-flex items-center gap-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 12px 5px 8px" }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7FC0]" />
              <span className="text-[13.5px] font-semibold text-white/85">{city}</span>
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative mt-4">
          <p className="m-0 text-[17px] font-bold text-white/40">No address set</p>
          <a className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#C69C66] no-underline" href="/addresses">
            Add a location
            <svg fill="none" height={14} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  const Icon = service.Icon;
  return (
    <CrmLink
      className="group relative block h-[150px] overflow-hidden rounded-[14px] transition hover:brightness-110 sm:h-[190px] xl:h-[210px]"
      crmEvent="recommendation_click"
      crmPayload={{
        action: "Book now",
        item: service.label,
        service: service.label,
      }}
      href={service.href}
      style={{ background: service.bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 15% 15%,rgba(255,255,255,0.14) 0%,transparent 55%)" }}
      />
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern height="22" id={`dot-${service.label}`} patternUnits="userSpaceOnUse" width="22">
            <circle cx="2" cy="2" fill="white" r="1.5" />
          </pattern>
        </defs>
        <rect fill={`url(#dot-${service.label})`} height="100%" width="100%" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute opacity-[0.13]"
        style={{ right: "-20px", bottom: "-20px", transform: "scale(3.2)", transformOrigin: "right bottom" }}
      >
        <Icon />
      </div>
      <div
        className="absolute left-0 top-0 flex h-[48px] items-center gap-2.5 pl-4 pr-5 sm:h-[52px] sm:gap-3 sm:pl-[18px] sm:pr-6"
        style={{ background: "rgba(0,0,0,0.22)", backdropFilter: "blur(6px)", borderRadius: "0 0 14px 0" }}
      >
        <span className="flex h-8 w-8 items-center justify-center [&>svg]:h-8 [&>svg]:w-8 sm:h-10 sm:w-10 sm:[&>svg]:h-10 sm:[&>svg]:w-10">
          <Icon />
        </span>
        <span className="text-[16px] font-bold text-white sm:text-[17px]">{service.label}</span>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-10"
        style={{ background: "linear-gradient(0deg,rgba(0,0,0,0.38) 0%,transparent 100%)" }}
      >
        <span className="text-[14px] font-semibold text-white/85">Book now →</span>
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
  // A clean happening now (or a cleaner on the way to one today) takes the
  // place of "Upcoming" until it's finished.
  const current =
    bookings.find((b) => b.status === "in_progress") ??
    bookings.find((b) => {
      if (b.status !== "cleaner_en_route") return false;
      const start = new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime();
      return start - now.getTime() <= 3 * 60 * 60 * 1000;
    }) ??
    null;
  const next = current ?? upcoming[0] ?? null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <CrmPageView customerId={user!.id} event="dashboard_view" />
      <LiveDashboardRefresh
        scope={`customer-dashboard-${user!.id}`}
        watches={bookingWatchesFor("customer")}
      />

      {/* Upcoming Cleaning */}
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <SectionBanner
            className="xl:flex-1"
            title={current ? "Current Session" : "Upcoming Cleaning"}
          />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap xl:flex-nowrap">
            <CrmLink
              className={`${pillPrimary} col-span-2`}
              crmEvent="book_session_click"
              crmPayload={{ action: "Book a Session", customer_id: user!.id }}
              href="/booking/new?fresh=1&returnTo=/dashboard"
              style={pillPrimaryStyle}
            >
              <svg aria-hidden fill="none" height={20} stroke="#fff" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24" width={20}>
                <path d="M5 12h14M12 5v14" />
              </svg>
              Book a Session
            </CrmLink>
            <CrmLink
              className={`${pillOutline} ${next ? "" : "col-span-2"}`}
              crmEvent="view_sessions_click"
              crmPayload={{ action: "View Sessions", customer_id: user!.id }}
              href="/bookings"
            >
              <svg aria-hidden fill="none" height={20} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24" width={20}>
                <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
                <circle cx="16" cy="16" r="6" />
                <path d="M17.5 17.5 16 16.3V14" />
              </svg>
              View Sessions
            </CrmLink>
            {next ? (
              <CrmLink
                className={pillOutline}
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
              >
                {current ? "View session" : "View request"}
              </CrmLink>
            ) : null}
          </div>
        </div>
        {current?.status === "in_progress" ? (
          <CleanCountdown
            bookingId={current.id}
            durationHours={current.estimated_duration_hours}
            role="customer"
            startedAt={current.actual_start_time}
          />
        ) : current ? (
          <p className="m-0 text-[15px] font-semibold text-[#524096]">
            Your cleaner is on the way.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CalendarTile booking={next} />
          <TimeTile booking={next} />
          <div className="sm:col-span-2 xl:col-span-1">
            <LocationTile booking={next} />
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <SectionBanner title="Popular Services" />
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.label} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
