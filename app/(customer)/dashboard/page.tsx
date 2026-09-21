import { CalendarCheck as CalendarCheckLucide, Plus } from "lucide-react";
import Link from "next/link";

import {
  DashboardHistoryList,
  DashboardSection,
  DashboardStatTiles,
  DashboardWelcomeBanner,
  UpcomingSessionBars,
} from "@/components/shared/dashboard-panels";
import { Button } from "@/components/ui/button";
import {
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
} from "@/lib/customer/booking-visibility";
import { getCustomerBookings } from "@/lib/customer/server";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import type { Booking } from "@/types/customer";

const DASHBOARD_BOOK_HREF = "/booking/new?fresh=1&returnTo=/dashboard";

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
  const recent = bookings
    .filter((booking) => ["completed", "cancelled"].includes(booking.status))
    .reverse()
    .slice(0, 5);
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const next = upcoming[0] ?? null;
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

      <DashboardStatTiles
        items={[
          {
            icon: "calendarBlank",
            label: "Upcoming",
            value: String(upcoming.length),
          },
          {
            icon: "sparkle",
            label: "Completed",
            tone: "lavenderOrange",
            value: String(completedCount),
          },
          {
            icon: "calendarCheck",
            label: "Next clean",
            value: next ? formatNextSlot(next) : "Not set",
          },
        ]}
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
        title="Upcoming cleans"
      >
        <UpcomingSessionBars
          emptyAction={
            <Button asChild className="rounded-full bg-[#1c133b] hover:bg-[#312c79]">
              <Link href={DASHBOARD_BOOK_HREF}>Start a booking</Link>
            </Button>
          }
          sessions={upcoming.map((booking) => sessionBar(booking))}
        />
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

      <DashboardSection eyebrow="Past visits" title="Session history">
        <DashboardHistoryList
          actionHref="/bookings?tab=past"
          actionLabel="View all history"
          emptyBody="Completed and cancelled sessions will appear here."
          emptyTitle="No session history yet"
          rows={recent.map((booking) => ({
            amount: booking.amount_total
              ? formatMoney(booking.amount_total)
              : "—",
            date: new Date(
              `${booking.scheduled_date}T12:00:00`,
            ).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            href: `/booking/${booking.id}`,
            person: personLabel(booking),
            service: formatServiceName(booking.service_type),
            status: booking.status.replaceAll("_", " "),
          }))}
        />
        {bookings.some((booking) => booking.status === "cancelled") ? (
          <p className="pt-2 text-sm text-[#5a5470]">
            Looking for cancelled sessions?{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/bookings?tab=cancelled"
            >
              View cancelled
            </Link>
          </p>
        ) : null}
      </DashboardSection>
    </div>
  );
}

function sessionBar(booking: Booking) {
  const waiting = isWaitingForCleanerAcceptance(booking.status);
  const cleanerVisible = isCleanerVisibleToCustomer(booking.status);
  const cleanerName = cleanerVisible
    ? booking.cleaner?.full_name?.split(" ")[0] ?? null
    : null;
  const when = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  ).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const person = cleanerName
    ? `with ${cleanerName}`
    : waiting
      ? "looking for a cleaner"
      : "cleaner TBC";

  return {
    ctaHref: `/booking/${booking.id}`,
    ctaLabel: waiting ? "View request" : "Manage session",
    href: `/booking/${booking.id}`,
    id: booking.id,
    meta: `${when} · ${person}`,
    secondaryHref:
      !waiting && cleanerVisible && booking.cleaner_id
        ? `/messages/${booking.id}`
        : null,
    secondaryLabel:
      !waiting && cleanerVisible && booking.cleaner_id ? "Message" : null,
    statusLabel: waiting ? "Looking for cleaner" : "Confirmed",
    statusTone: waiting ? ("waiting" as const) : ("confirmed" as const),
    title: formatServiceName(booking.service_type),
  };
}

function formatNextSlot(booking: Booking) {
  return new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  ).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function personLabel(booking: Booking) {
  if (
    isCleanerVisibleToCustomer(booking.status) &&
    booking.cleaner?.full_name
  ) {
    return booking.cleaner.full_name.split(" ")[0]!;
  }
  return "—";
}
