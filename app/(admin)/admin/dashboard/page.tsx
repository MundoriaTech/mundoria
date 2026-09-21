import {
  AlertTriangle,
  Star,
} from "lucide-react";
import Link from "next/link";

import { OperationsMap } from "@/components/admin/operations-map";
import { RematchButton } from "@/components/admin/rematch-button";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { DashboardStatTiles } from "@/components/shared/dashboard-stat-tiles";
import { formatMoney } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking, RevenuePoint } from "@/types/admin";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [
    { data: bookings },
    { data: disputes },
    { data: cleaners },
    { data: ratings },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select("*, address:addresses(*), customer:profiles!bookings_customer_id_fkey(full_name), cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
      .order("created_at", { ascending: false }),
    admin.from("disputes").select("*").order("created_at", { ascending: false }),
    admin
      .from("cleaner_profiles")
      .select("status,no_show_count,cancellation_count,onboarding_complete"),
    admin
      .from("ratings")
      .select("overall_score,application_status")
      .eq("application_status", "applied"),
  ]);
  const all = (bookings ?? []) as AdminBooking[];
  const todayBookings = all.filter((booking) => booking.scheduled_date === today);
  const active = all.filter((booking) =>
    ["cleaner_en_route", "in_progress"].includes(booking.status),
  );
  const revenueToday = todayBookings
    .filter((booking) => booking.payment_status === "released")
    .reduce((sum, booking) => sum + (booking.amount_platform ?? 0), 0);
  const pending = (cleaners ?? []).filter(
    (cleaner) =>
      (cleaner.status === "pending" || cleaner.status === "in_training") &&
      cleaner.onboarding_complete,
  ).length;
  const avgRating = ratings?.length
    ? ratings.reduce((sum, rating) => sum + Number(rating.overall_score), 0) /
      ratings.length
    : 0;
  const completed = all.filter((booking) => booking.status === "completed").length;
  const noShowBookings = all.filter((booking) => booking.status === "no_show").length;
  const cancelledBookings = all.filter(
    (booking) => booking.status === "cancelled",
  ).length;
  const finishedLike = completed + noShowBookings + cancelledBookings;
  const revenuePoints: RevenuePoint[] = all
    .filter((booking) => booking.payment_status === "released")
    .map((booking) => ({
      date: booking.scheduled_date,
      revenue: booking.amount_platform ?? 0,
    }));
  const alerts = all.filter(
    (booking) =>
      booking.status === "cancelled" &&
      booking.payment_status === "held" &&
      new Date(booking.updated_at ?? booking.created_at).getTime() >
        Date.now() - 24 * 60 * 60 * 1000,
  );
  const weekday = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#1c133b] px-5 py-6 text-white shadow-[0_20px_48px_rgba(28,19,59,0.18)] sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-[#f0a888]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-[#823fb2]/45 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0a888]">
              {weekday}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Operations desk
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Jobs running today, cleaners waiting for review, and money coming
              in.
            </p>
          </div>
          {pending > 0 ? (
            <Link
              className="inline-flex w-full items-center justify-center rounded-full bg-[#d4694a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c45a3c] sm:w-auto"
              href="/admin/cleaners"
            >
              Review {pending} cleaner{pending === 1 ? "" : "s"}
            </Link>
          ) : (
            <Link
              className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto"
              href="/admin/bookings"
            >
              Open bookings
            </Link>
          )}
        </div>
      </section>

      <DashboardStatTiles
        items={[
          {
            icon: "calendarCheck",
            label: "Bookings today",
            tone: "peachPurple",
            value: String(todayBookings.length),
          },
          {
            icon: "pulse",
            label: "Jobs in progress",
            tone: "lavenderOrange",
            value: String(active.length),
          },
          {
            icon: "currencyGbp",
            label: "Revenue today",
            tone: "lineOnly",
            value: formatMoney(revenueToday),
          },
          {
            icon: "usersThree",
            label: "Cleaners to review",
            tone: "peachPurple",
            value: String(pending),
          },
        ]}
      />

      {alerts.length ? (
        <div className="space-y-3 rounded-[1.5rem] border border-amber-300/60 bg-[#fff8ef] p-4 sm:p-5">
          <p className="font-semibold text-[#1c133b]">
            <AlertTriangle className="mr-2 inline h-5 w-5 text-amber-600" />
            {alerts.length} cancelled booking{alerts.length > 1 ? "s" : ""} still
            need a new cleaner (payment held).
          </p>
          {alerts.slice(0, 3).map((booking) => (
            <div
              className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={booking.id}
            >
              <span className="text-sm text-[#4a4266]">
                Booking {booking.id.slice(0, 8)} ·{" "}
                {booking.scheduled_start_time.slice(0, 5)}
              </span>
              <RematchButton bookingId={booking.id} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <RevenueChart points={revenuePoints} />
        <section className="rounded-[1.5rem] border border-[#e8e0f4] bg-white p-5 shadow-[0_12px_28px_rgba(49,44,121,0.04)]">
          <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
            Quality
          </h2>
          <Health
            icon={Star}
            label="Average rating"
            value={`${avgRating.toFixed(2)}/5`}
          />
          <Health
            label="No-show rate"
            value={`${finishedLike ? ((noShowBookings / finishedLike) * 100).toFixed(1) : 0}%`}
          />
          <Health
            label="Cancellation rate"
            value={`${all.length ? ((cancelledBookings / all.length) * 100).toFixed(1) : 0}%`}
          />
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-[#e8e0f4] bg-white p-5 shadow-[0_12px_28px_rgba(49,44,121,0.04)]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
              Live map
            </h2>
            <p className="text-sm text-[#5a5470]">
              Pending, en route, and in-progress jobs
            </p>
          </div>
        </div>
        <div className="mt-4">
          <OperationsMap
            bookings={all.filter((booking) =>
              ["pending_match", "cleaner_en_route", "in_progress"].includes(
                booking.status,
              ),
            )}
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e8e0f4] bg-white p-4 shadow-[0_12px_28px_rgba(49,44,121,0.04)] sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
          Recent activity
        </h2>
        <div className="mt-4 divide-y divide-[#efe8f8]">
          {[
            ...all.slice(0, 7).map((booking) => ({
              date: booking.created_at,
              text: `Booking ${booking.id.slice(0, 8)} · ${booking.status.replaceAll("_", " ")}`,
            })),
            ...(disputes ?? []).slice(0, 3).map((dispute) => ({
              date: dispute.created_at,
              text: `Dispute opened · ${dispute.type}`,
            })),
          ]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
            .map((item, index) => (
              <div
                className="flex flex-col gap-1 py-3 text-sm last:border-0 sm:flex-row sm:justify-between sm:gap-4"
                key={`${item.date}-${index}`}
              >
                <span className="min-w-0 font-medium text-[#1c133b]">
                  {item.text}
                </span>
                <span className="shrink-0 text-[#5a5470]">
                  {new Date(item.date).toLocaleString("en-GB")}
                </span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function Health({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="mt-5 flex items-center justify-between border-b border-[#efe8f8] pb-4 last:border-0">
      <span className="flex items-center gap-2 text-sm text-[#5a5470]">
        {Icon ? <Icon className="h-4 w-4 text-[#823fb2]" /> : null}
        {label}
      </span>
      <b className="text-[#1c133b]">{value}</b>
    </div>
  );
}
