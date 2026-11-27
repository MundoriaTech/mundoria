import type { Metadata } from "next";

import { CrmLink } from "@/components/analytics/crm-link";
import { CrmPageView } from "@/components/analytics/crm-page-view";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import { LocationTile, TimeTile } from "@/components/customer/dashboard/tiles";
import { PopularServices } from "@/components/customer/dashboard/popular-services";
import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getPopularServices } from "@/lib/customer/popular-services";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";
import { CleanCountdown } from "@/components/shared/clean-countdown";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [bookings, popular] = await Promise.all([
    getCustomerBookings(supabase, user!.id),
    getPopularServices(8),
  ]);
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

      <PopularServices services={popular} />
    </div>
  );
}
