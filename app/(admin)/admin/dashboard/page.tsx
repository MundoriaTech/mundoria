import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Star,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";

import { OperationsMap } from "@/components/admin/operations-map";
import { RematchButton } from "@/components/admin/rematch-button";
import { RevenueChart } from "@/components/admin/revenue-chart";
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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{weekday}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Jobs running today, cleaners waiting for review, and money in.
          </p>
        </div>
        {pending > 0 ? (
          <Link
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:w-auto"
            href="/admin/cleaners"
          >
            Review {pending} cleaner{pending === 1 ? "" : "s"}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarCheck} label="Bookings today" value={String(todayBookings.length)} />
        <Kpi icon={Activity} label="Jobs in progress" value={String(active.length)} />
        <Kpi icon={Banknote} label="Revenue today" value={formatMoney(revenueToday)} />
        <Kpi icon={UserRoundCheck} label="Cleaners to review" value={String(pending)} />
      </div>

      {alerts.length ? (
        <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
          <p className="font-semibold">
            <AlertTriangle className="mr-2 inline h-5 w-5 text-amber-600" />
            {alerts.length} cancelled booking{alerts.length > 1 ? "s" : ""} still
            need a new cleaner (payment held).
          </p>
          {alerts.slice(0, 3).map((booking) => (
            <div
              className="flex flex-col gap-3 rounded-xl bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              key={booking.id}
            >
              <span className="text-sm">
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
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Quality</h2>
          <Health label="Average rating" value={`${avgRating.toFixed(2)}/5`} icon={Star} />
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

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Live map</h2>
            <p className="text-sm text-muted-foreground">
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

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
        <div className="mt-4 divide-y divide-border">
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
                className="flex flex-col gap-1 border-b border-border py-3 text-sm last:border-0 sm:flex-row sm:justify-between sm:gap-4"
                key={`${item.date}-${index}`}
              >
                <span className="min-w-0 font-medium text-foreground">
                  {item.text}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(item.date).toLocaleString("en-GB")}
                </span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/30">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
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
    <div className="mt-5 flex items-center justify-between border-b border-border pb-4 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </span>
      <b className="text-foreground">{value}</b>
    </div>
  );
}
