import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
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
      <div className="relative overflow-hidden rounded-[2rem] bg-[#221f50] p-6 text-white shadow-2xl shadow-[#221f50]/15 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffc79f]/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-[#7669d1]/35 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-[#ffc79f]">
              <Sparkles className="h-4 w-4" />
              Platform overview
            </p>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Admin dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Track live jobs, cleaner certification, payments, service quality,
              and operational alerts from one CleanScape command centre.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-[#ffc79f]" />
              Today’s operational snapshot
            </p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {active.length} active job{active.length === 1 ? "" : "s"} ·{" "}
              {pending} cleaner application{pending === 1 ? "" : "s"} pending
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarCheck} label="Bookings today" value={String(todayBookings.length)} />
        <Kpi icon={Activity} label="Active jobs" value={String(active.length)} />
        <Kpi icon={Banknote} label="Revenue today" value={formatMoney(revenueToday)} />
        <Kpi icon={UserRoundCheck} label="Pending cleaners" value={String(pending)} />
      </div>
      {alerts.length ? (
        <div className="space-y-2 rounded-[1.5rem] border border-[#ffd0b0] bg-[#fff4ec] p-4 text-sm text-[#7a3413] shadow-lg shadow-[#ffc79f]/10">
          <p className="font-semibold"><AlertTriangle className="mr-2 inline h-5 w-5" />{alerts.length} late cancellation alert{alerts.length > 1 ? "s" : ""} require attention.</p>
          {alerts.slice(0, 3).map((booking) => (
            <div className="flex items-center justify-between rounded-2xl bg-white/75 p-3" key={booking.id}>
              <span>Booking {booking.id.slice(0, 8)} · {booking.scheduled_start_time.slice(0, 5)}</span>
              <RematchButton bookingId={booking.id} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <RevenueChart points={revenuePoints} />
        <section className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-5 shadow-lg shadow-[#5a51aa]/5">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#221f50]">Platform health</h2>
          <Health label="Average rating" value={`${avgRating.toFixed(2)}/5`} icon={Star} />
          <Health label="No-show rate" value={`${completed ? ((noShows / completed) * 100).toFixed(1) : 0}%`} />
          <Health label="Cancellation rate" value={`${all.length ? ((cancellations / all.length) * 100).toFixed(1) : 0}%`} />
        </section>
      </div>
      <section className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-5 shadow-lg shadow-[#5a51aa]/5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#5a51aa]">Real-time operations monitor</p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#221f50]">Live operations</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pending, en-route, and in-progress jobs
          </p>
        </div>
        <div className="mt-4">
          <OperationsMap bookings={all.filter((booking) => ["pending_match", "cleaner_en_route", "in_progress"].includes(booking.status))} />
        </div>
      </section>
      <section className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-5 shadow-lg shadow-[#5a51aa]/5">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#221f50]">Recent activity</h2>
        <div className="mt-4 divide-y divide-[#eeeafd]">
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
                <span className="font-medium text-[#221f50]">{item.text}</span>
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
    <div className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-5 shadow-lg shadow-[#5a51aa]/5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7e4ff] text-[#5a51aa]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#221f50]">{value}</p>
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
    <div className="mt-5 flex items-center justify-between border-b border-[#eeeafd] pb-4 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </span>
      <b className="text-[#221f50]">{value}</b>
    </div>
  );
}
