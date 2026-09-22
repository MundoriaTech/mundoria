import { CalendarCheck as CalendarCheckLucide, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import {
  DashboardEmptyCard,
  DashboardSection,
  DashboardWelcomeBanner,
  SessionHighlightCard,
} from "@/components/shared/dashboard-panels";
import { Button } from "@/components/ui/button";
import {
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
  sessionPhotoForService,
} from "@/lib/customer/booking-visibility";
import { getCustomerBookings } from "@/lib/customer/server";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import type { Booking } from "@/types/customer";

const DASHBOARD_BOOK_HREF = "/booking/new?fresh=1&returnTo=/dashboard";
const MAX_ALSO_SCHEDULED = 5;

export const metadata = { title: "Customer dashboard" };

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, bookings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    getCustomerBookings(supabase, user!.id),
  ]);
  const now = new Date();
  const upcoming = bookings
    .filter(
      (booking) =>
        !["completed", "cancelled"].includes(booking.status) &&
        new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`) >=
          now,
    )
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const next = upcoming[0] ?? null;
  const later = upcoming.slice(1, 1 + MAX_ALSO_SCHEDULED);
  const laterOverflow = upcoming.length - 1 - later.length;
  const customer = profile as Profile;
  const firstName = customer.full_name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="space-y-8 pb-4">
      <DashboardWelcomeBanner
        actions={
          <>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3.5 text-xs font-semibold text-[#1c133b] shadow-[0_8px_20px_rgba(28,19,59,0.16)] transition hover:bg-[#f7f2ea] sm:h-12 sm:px-6 sm:text-sm"
              href={DASHBOARD_BOOK_HREF}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Book a session
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/35 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/18 sm:h-12 sm:px-6 sm:text-sm"
              href="/bookings"
            >
              <CalendarCheckLucide className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              View sessions
            </Link>
          </>
        }
        firstName={firstName}
        subtitle="Keep track of your cleaning services, upcoming bookings, and past appointments."
      />

      <DashboardSection
        action={
          upcoming.length > 1 ? (
            <Link
              className="text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/bookings"
            >
              View all
            </Link>
          ) : null
        }
        eyebrow="Coming up"
        title="Next clean"
      >
        {next ? (
          <div className="space-y-6">
            <SessionHighlightCard
              actions={
                <>
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
                    href={`/booking/${next.id}`}
                  >
                    {isWaitingForCleanerAcceptance(next.status)
                      ? "View request"
                      : "Manage session"}
                  </Link>
                  {isCleanerVisibleToCustomer(next.status) && next.cleaner_id ? (
                    <Link
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea]"
                      href={`/messages/${next.id}`}
                    >
                      Message
                    </Link>
                  ) : null}
                </>
              }
              meta={[
                {
                  label: "Date",
                  value: new Date(
                    `${next.scheduled_date}T12:00:00`,
                  ).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }),
                },
                {
                  label: "Time",
                  value: next.scheduled_start_time.slice(0, 5),
                },
                {
                  label: "Where",
                  value: next.address?.city ?? next.address?.postcode ?? "—",
                },
                {
                  label: "Total",
                  value: next.amount_total
                    ? formatMoney(next.amount_total)
                    : "—",
                },
              ]}
              personLine={personLine(next)}
              photoSrc={sessionPhotoForService(next.service_type)}
              statusLabel={
                isWaitingForCleanerAcceptance(next.status)
                  ? "Looking for cleaner"
                  : "Confirmed"
              }
              statusTone={
                isWaitingForCleanerAcceptance(next.status)
                  ? "waiting"
                  : "confirmed"
              }
              title={formatServiceName(next.service_type)}
            />

            {later.length ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b8798]">
                    Also scheduled
                  </p>
                  {laterOverflow > 0 ? (
                    <Link
                      className="text-xs font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                      href="/bookings"
                    >
                      +{laterOverflow} more
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-3">
                  {later.map((booking) => {
                    const when = new Date(
                      `${booking.scheduled_date}T${booking.scheduled_start_time}`,
                    );
                    const day = when.toLocaleDateString("en-GB", {
                      day: "numeric",
                    });
                    const month = when.toLocaleDateString("en-GB", {
                      month: "short",
                    });
                    const weekday = when.toLocaleDateString("en-GB", {
                      weekday: "short",
                    });
                    const time = booking.scheduled_start_time.slice(0, 5);
                    const waiting = isWaitingForCleanerAcceptance(
                      booking.status,
                    );

                    return (
                      <li key={booking.id}>
                        <Link
                          className="group flex items-center gap-3 border-b border-[#ece8f3] py-3 last:border-b-0 dark:border-border"
                          href={`/booking/${booking.id}`}
                        >
                          <div className="flex w-12 shrink-0 flex-col items-center leading-none">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#8b8798]">
                              {month}
                            </span>
                            <span className="mt-0.5 text-lg font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
                              {day}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1c133b] dark:text-foreground">
                              {formatServiceName(booking.service_type)}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#5a5470] dark:text-muted-foreground">
                              {weekday} · {time}
                              {waiting ? " · looking for cleaner" : ""}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#c4bfd4] transition group-hover:text-[#6a45b8]" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <DashboardEmptyCard
            action={
              <Button asChild className="rounded-full bg-[#1c133b] hover:bg-[#312c79]">
                <Link href={DASHBOARD_BOOK_HREF}>Start a booking</Link>
              </Button>
            }
            body="Book a session and your next clean will show up here with date, time and status."
            title="Nothing scheduled yet"
          />
        )}
      </DashboardSection>

      {customer.referral_code ? (
        <section className="rounded-[1.75rem] bg-[#f3efe6] p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Share Mundoria
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            Give £10, get £10
          </h2>
          <p className="mt-2 max-w-xl text-sm font-light leading-6 text-[#3d3a48]">
            Share code{" "}
            <span className="font-semibold text-[#312c79]">
              {customer.referral_code}
            </span>
            . Friends get £10 off their first clean; you get £10 after they
            complete it.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function personLine(booking: Booking) {
  if (isWaitingForCleanerAcceptance(booking.status)) {
    return "We’re looking for your cleaner";
  }
  if (
    isCleanerVisibleToCustomer(booking.status) &&
    booking.cleaner?.full_name
  ) {
    return `With ${booking.cleaner.full_name.split(" ")[0]}`;
  }
  return "Cleaner to be confirmed";
}
