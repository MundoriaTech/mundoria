import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Star,
  UserRoundCheck,
} from "lucide-react";

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
    admin.from("ratings").select("overall_score"),
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
    (cleaner) => cleaner.status === "pending" && cleaner.onboarding_complete,
  ).length;
  const avgRating = ratings?.length
    ? ratings.reduce((sum, rating) => sum + Number(rating.overall_score), 0) /
      ratings.length
    : 0;
  const noShows = (cleaners ?? []).reduce(
    (sum, cleaner) => sum + cleaner.no_show_count,
    0,
  );
  const cancellations = (cleaners ?? []).reduce(
    (sum, cleaner) => sum + cleaner.cancellation_count,
    0,
  );
  const completed = all.filter((booking) => booking.status === "completed").length;
  const revenuePoints: RevenuePoint[] = all
    .filter((booking) => booking.payment_status === "released")
    .map((booking) => ({
      date: booking.scheduled_date,
      revenue: booking.amount_platform ?? 0,
    }));
  const alerts = all.filter(
    (booking) =>
      booking.status === "cancelled" &&
      new Date(booking.updated_at ?? booking.created_at).getTime() >
        Date.now() - 24 * 60 * 60 * 1000,
  );

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-primary">Platform overview</p>
        <h1 className="text-3xl font-semibold">Admin dashboard</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarCheck} label="Bookings today" value={String(todayBookings.length)} />
        <Kpi icon={Activity} label="Active jobs" value={String(active.length)} />
        <Kpi icon={Banknote} label="Revenue today" value={formatMoney(revenueToday)} />
        <Kpi icon={UserRoundCheck} label="Pending cleaners" value={String(pending)} />
      </div>
      {alerts.length ? (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p><AlertTriangle className="mr-2 inline h-5 w-5" />{alerts.length} late cancellation alert{alerts.length > 1 ? "s" : ""} require attention.</p>
          {alerts.slice(0, 3).map((booking) => (
            <div className="flex items-center justify-between rounded-lg bg-white/70 p-2" key={booking.id}>
              <span>Booking {booking.id.slice(0, 8)} · {booking.scheduled_start_time.slice(0, 5)}</span>
              <RematchButton bookingId={booking.id} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <RevenueChart points={revenuePoints} />
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Platform health</h2>
          <Health label="Average rating" value={`${avgRating.toFixed(2)}/5`} icon={Star} />
          <Health label="No-show rate" value={`${completed ? ((noShows / completed) * 100).toFixed(1) : 0}%`} />
          <Health label="Cancellation rate" value={`${all.length ? ((cancellations / all.length) * 100).toFixed(1) : 0}%`} />
        </section>
      </div>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Live operations</h2>
        <div className="mt-4">
          <OperationsMap bookings={all.filter((booking) => ["pending_match", "cleaner_en_route", "in_progress"].includes(booking.status))} />
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Recent activity</h2>
        <div className="mt-4 divide-y">
          {[...all.slice(0, 7).map((booking) => ({
            date: booking.created_at,
            text: `Booking ${booking.id.slice(0, 8)} · ${booking.status.replaceAll("_", " ")}`,
          })), ...(disputes ?? []).slice(0, 3).map((dispute) => ({
            date: dispute.created_at,
            text: `Dispute opened · ${dispute.type}`,
          }))]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
            .map((item, index) => (
              <div className="flex justify-between gap-4 py-3 text-sm" key={`${item.date}-${index}`}>
                <span>{item.text}</span>
                <span className="text-muted-foreground">
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
    <div className="rounded-xl border bg-white p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
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
    <div className="mt-5 flex items-center justify-between border-b pb-4 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </span>
      <b>{value}</b>
    </div>
  );
}
