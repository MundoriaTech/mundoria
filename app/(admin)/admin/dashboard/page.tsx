import {
  AlertTriangle,
  Star,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { OperationsMap } from "@/components/admin/operations-map";
import { RematchButton } from "@/components/admin/rematch-button";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { DashboardStatTiles } from "@/components/shared/dashboard-stat-tiles";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { loadAdminUserCounts } from "@/lib/admin/user-counts";
import { OPS_REFRESH_MS } from "@/lib/dashboard/live-refresh";
import { formatMoney } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking, RevenuePoint } from "@/types/admin";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const chartFrom = new Date();
  chartFrom.setDate(chartFrom.getDate() - 90);
  const chartFromIso = chartFrom.toISOString().slice(0, 10);
  const alertSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: todayBookingsData },
    { count: activeCount },
    { data: liveMapBookings },
    { data: releasedForChart },
    { data: rematchAlerts },
    { data: recentBookings },
    { data: recentDisputes },
    { count: completedCount },
    { count: noShowCount },
    { count: cancelledCount },
    { count: totalBookingsCount },
    { count: pendingReviewCount },
    { data: ratings },
    people,
  ] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id,scheduled_date,scheduled_start_time,status,payment_status,amount_platform,updated_at,created_at",
      )
      .eq("scheduled_date", today),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["cleaner_en_route", "in_progress"]),
    admin
      .from("bookings")
      .select(
        "*, address:addresses(*), customer:profiles!bookings_customer_id_fkey(full_name), cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)",
      )
      .in("status", ["pending_match", "cleaner_en_route", "in_progress"])
      .order("scheduled_date", { ascending: true })
      .limit(100),
    admin
      .from("bookings")
      .select("scheduled_date,amount_platform")
      .eq("payment_status", "released")
      .gte("scheduled_date", chartFromIso)
      .order("scheduled_date", { ascending: true })
      .limit(2000),
    admin
      .from("bookings")
      .select(
        "id,scheduled_start_time,status,payment_status,updated_at,created_at",
      )
      .eq("status", "cancelled")
      .eq("payment_status", "held")
      .gte("updated_at", alertSince)
      .order("updated_at", { ascending: false })
      .limit(20),
    admin
      .from("bookings")
      .select("id,status,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("disputes")
      .select("id,type,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "no_show"),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    admin.from("bookings").select("id", { count: "exact", head: true }),
    admin
      .from("cleaner_profiles")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_training"])
      .eq("onboarding_complete", true),
    admin
      .from("ratings")
      .select("overall_score")
      .eq("application_status", "applied")
      .limit(500),
    loadAdminUserCounts(),
  ]);

  const todayBookings = todayBookingsData ?? [];
  const revenueToday = todayBookings
    .filter((booking) => booking.payment_status === "released")
    .reduce((sum, booking) => sum + (booking.amount_platform ?? 0), 0);
  const pending = pendingReviewCount ?? 0;
  const avgRating = ratings?.length
    ? ratings.reduce((sum, rating) => sum + Number(rating.overall_score), 0) /
      ratings.length
    : 0;
  const completed = completedCount ?? 0;
  const noShowBookings = noShowCount ?? 0;
  const cancelledBookings = cancelledCount ?? 0;
  const finishedLike = completed + noShowBookings + cancelledBookings;
  const revenuePoints: RevenuePoint[] = (releasedForChart ?? []).map(
    (booking) => ({
      date: booking.scheduled_date,
      revenue: booking.amount_platform ?? 0,
    }),
  );
  const alerts = rematchAlerts ?? [];
  const mapBookings = (liveMapBookings ?? []) as AdminBooking[];
  const weekday = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <LiveDashboardRefresh intervalMs={OPS_REFRESH_MS} scope="admin-dashboard" />

      {/* Today banner + action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="relative flex h-[70px] flex-1 items-center overflow-hidden rounded-[14px] px-6"
          style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
          />
          <h2 className="relative text-[22.8px] font-semibold leading-none tracking-[-0.01em] text-white">
            {weekday}
          </h2>
        </div>
        {pending > 0 ? (
          <Link
            className="inline-flex h-[57px] shrink-0 items-center justify-center gap-3 rounded-full bg-[#524096] px-6 text-[17.4px] font-semibold text-white transition hover:bg-[#45357F]"
            href="/admin/cleaners"
          >
            <UsersRound className="h-[22px] w-[22px]" strokeWidth={1.8} />
            Review {pending} cleaner{pending === 1 ? "" : "s"}
          </Link>
        ) : (
          <Link
            className="inline-flex h-[57px] shrink-0 items-center justify-center gap-3 rounded-full border-2 border-[#524096] px-6 text-[17.4px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
            href="/admin/bookings"
          >
            Open bookings
          </Link>
        )}
      </div>

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
            value: String(activeCount ?? 0),
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

      <section className="rounded-[1.5rem] border border-[#e8e0f4] bg-white p-5 shadow-[0_12px_28px_rgba(49,44,121,0.04)]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
              People
            </h2>
            <p className="text-sm text-[#5a5470]">
              Everyone with a Mundoria account, by role
            </p>
          </div>
          <p className="text-sm font-medium text-[#1c133b]">
            {people.total.toLocaleString("en-GB")} total
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PeopleLink
            href="/admin/customers"
            label="Customers"
            value={people.customers}
          />
          <PeopleLink
            href="/admin/cleaners"
            label="Cleaners"
            value={people.cleaners}
          />
          <PeopleLink
            href="/admin/team"
            label="Admins"
            value={people.admins}
          />
        </div>
      </section>

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
            value={`${
              totalBookingsCount
                ? ((cancelledBookings / totalBookingsCount) * 100).toFixed(1)
                : 0
            }%`}
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
          <OperationsMap bookings={mapBookings} />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e8e0f4] bg-white p-4 shadow-[0_12px_28px_rgba(49,44,121,0.04)] sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
          Recent activity
        </h2>
        <div className="mt-4 divide-y divide-[#efe8f8]">
          {[
            ...(recentBookings ?? []).map((booking) => ({
              date: booking.created_at,
              text: `Booking ${booking.id.slice(0, 8)} · ${booking.status.replaceAll("_", " ")}`,
            })),
            ...(recentDisputes ?? []).map((dispute) => ({
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

function PeopleLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      className="rounded-2xl border border-[#efe8f8] bg-[#fbf9ff] px-4 py-4 transition hover:border-[#d9c8f0] hover:bg-white"
      href={href}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b]">
        {value.toLocaleString("en-GB")}
      </p>
    </Link>
  );
}
