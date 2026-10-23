import Link from "next/link";
import { notFound } from "next/navigation";

import { IncidentActions } from "@/components/admin/incident-actions";
import { formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminIncidentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: incident } = await createAdminClient()
    .from("cleaner_incidents")
    .select(
      "*,cleaner:profiles!cleaner_incidents_cleaner_id_fkey(id,full_name,email,phone),booking:bookings(id,service_type,status,scheduled_date,scheduled_start_time)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!incident) notFound();

  const cleaner = Array.isArray(incident.cleaner)
    ? incident.cleaner[0]
    : incident.cleaner;
  const booking = Array.isArray(incident.booking)
    ? incident.booking[0]
    : incident.booking;
  const fmt = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Cleaner incident
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {incident.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reported {fmt(incident.created_at)}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Report</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Cleaner</dt>
                <dd className="font-medium">
                  {cleaner ? (
                    <Link
                      className="text-primary underline-offset-2 hover:underline"
                      href={`/admin/cleaners/${cleaner.id}`}
                    >
                      {cleaner.full_name ?? "Cleaner"}
                    </Link>
                  ) : (
                    "—"
                  )}
                  <br />
                  <span className="font-normal text-muted-foreground">
                    {cleaner?.phone ?? cleaner?.email ?? ""}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Category · severity</dt>
                <dd className="font-medium capitalize">
                  {String(incident.category).replaceAll("_", " ")} ·{" "}
                  {incident.severity}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Occurred</dt>
                <dd className="font-medium">{fmt(incident.occurred_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">{incident.location_note ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Emergency services</dt>
                <dd className="font-medium">
                  {incident.emergency_services_contacted
                    ? "Contacted"
                    : "Not contacted"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Booking</dt>
                <dd className="font-medium">
                  {booking ? (
                    <Link
                      className="text-primary underline-offset-2 hover:underline"
                      href={`/admin/booking/${booking.id}`}
                    >
                      {formatServiceName(booking.service_type)} #
                      {booking.id.slice(0, 8)}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">What happened</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium">
                  {incident.description}
                </dd>
              </div>
              {incident.resolved_at ? (
                <div>
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="font-medium">{fmt(incident.resolved_at)}</dd>
                </div>
              ) : null}
              {incident.riddor_recorded_at ? (
                <div>
                  <dt className="text-muted-foreground">RIDDOR flagged</dt>
                  <dd className="font-medium">
                    {fmt(incident.riddor_recorded_at)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <IncidentActions
          adminNotes={incident.admin_notes}
          incidentId={incident.id}
          riddorRequired={Boolean(incident.riddor_required)}
          status={incident.status}
        />
      </div>
    </div>
  );
}
