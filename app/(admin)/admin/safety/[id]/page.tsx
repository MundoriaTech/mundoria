import Link from "next/link";
import { notFound } from "next/navigation";

import { SafetyAlertActions } from "@/components/admin/safety-alert-actions";
import { AppPage } from "@/components/shared/app-page";
import {
  SAFETY_REASON_LABELS,
  type SafetyAlertReason,
} from "@/lib/bookings/safety-alert-shared";
import { formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSafetyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const { data: alert } = await admin
    .from("booking_safety_alerts")
    .select(
      "*,raised_by_profile:profiles!booking_safety_alerts_raised_by_fkey(full_name,email,phone),booking:bookings(id,service_type,status,scheduled_date,scheduled_start_time,safety_hold_at,customer:profiles!bookings_customer_id_fkey(full_name,email,phone),cleaner:profiles!bookings_cleaner_id_fkey(full_name,email,phone))",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!alert) notFound();

  const booking = Array.isArray(alert.booking) ? alert.booking[0] : alert.booking;
  const raiser = Array.isArray(alert.raised_by_profile)
    ? alert.raised_by_profile[0]
    : alert.raised_by_profile;

  return (
    <AppPage
      className="space-y-6"
      description={`Raised ${new Date(alert.created_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`}
      eyebrow="Safety alert"
      title={`Case #${alert.id.slice(0, 8)}`}
    >

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Alert details</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">
                {String(alert.status).replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reason</dt>
              <dd className="font-medium">
                {SAFETY_REASON_LABELS[alert.reason as SafetyAlertReason] ??
                  alert.reason}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Raised by</dt>
              <dd className="font-medium">
                {raiser?.full_name ?? "—"} ({alert.raised_by_role})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium">
                {raiser?.phone ?? "—"}
                <br />
                <span className="text-muted-foreground">{raiser?.email}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Private note</dt>
              <dd className="mt-1 whitespace-pre-wrap font-medium">
                {alert.note?.trim() || "None"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address snapshot</dt>
              <dd className="font-medium">{alert.address_line ?? "—"}</dd>
            </div>
            {alert.outcome_notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Outcome notes</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium">
                  {alert.outcome_notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 text-sm">
            <h2 className="font-semibold">Booking</h2>
            {booking ? (
              <div className="mt-3 space-y-2">
                <p>
                  <Link
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    href={`/admin/booking/${booking.id}`}
                  >
                    {formatServiceName(booking.service_type)} #
                    {booking.id.slice(0, 8)}
                  </Link>
                </p>
                <p>
                  Status: <b className="capitalize">{booking.status}</b>
                  {booking.safety_hold_at ? " · hold active" : ""}
                </p>
                <p>
                  When: {booking.scheduled_date} at{" "}
                  {String(booking.scheduled_start_time).slice(0, 5)}
                </p>
                <p>
                  Customer: {booking.customer?.full_name ?? "—"} ·{" "}
                  {booking.customer?.phone ?? booking.customer?.email}
                </p>
                <p>
                  Cleaner: {booking.cleaner?.full_name ?? "—"} ·{" "}
                  {booking.cleaner?.phone ?? booking.cleaner?.email}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-muted-foreground">Booking unavailable.</p>
            )}
          </section>
          <SafetyAlertActions alertId={alert.id} status={alert.status} />
        </div>
      </div>
    </AppPage>
  );
}
