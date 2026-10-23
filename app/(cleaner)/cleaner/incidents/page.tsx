import Link from "next/link";
import { redirect } from "next/navigation";

import {
  IncidentReportForm,
  type IncidentBookingOption,
} from "@/components/cleaner/incident-report-form";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { INCIDENT_CATEGORIES } from "@/lib/cleaner/onboarding-compliance";
import { formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Report an incident" };

interface IncidentRow {
  category: string;
  created_at: string;
  id: string;
  severity: "standard" | "urgent" | "emergency";
  status: string;
  title: string;
}

const STATUS_LABELS: Record<string, string> = {
  action_required: "Action required",
  closed: "Closed",
  resolved: "Resolved",
  submitted: "Submitted",
  under_review: "Under review",
};

export default async function CleanerIncidentsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [context, jobs, { data }] = await Promise.all([
    getCleanerContext(supabase, user.id),
    getCleanerJobs(user.id),
    supabase
      .from("cleaner_incidents")
      .select("id,category,severity,title,status,created_at")
      .eq("cleaner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!context.cleanerProfile || !context.profile) redirect("/");

  const incidents = (data ?? []) as IncidentRow[];
  const bookings: IncidentBookingOption[] = [...jobs]
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 30)
    .map((job) => ({
      id: job.id,
      label: `${new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )} · ${formatServiceName(job.service_type)}${
        job.address?.city ? ` · ${job.address.city}` : ""
      }`,
    }));

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c133b] sm:text-3xl">
          Report an incident
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5c5670] sm:text-base">
          Tell us about injuries, damage, unsafe conditions, theft or anything
          that worried you on a job. See our{" "}
          <Link
            className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
            href="/legal/cleaner-standards"
          >
            Cleaner Standards
          </Link>{" "}
          for more.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <IncidentReportForm bookings={bookings} />

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-[#1c133b]">
            Your reports
          </h2>
          {incidents.length ? (
            <ul className="mt-4 space-y-3">
              {incidents.map((incident) => (
                <li
                  className="rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-4"
                  key={incident.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c79c66]">
                      {INCIDENT_CATEGORIES.find(
                        (item) => item.value === incident.category,
                      )?.label ?? incident.category}
                    </p>
                    <span className="rounded-full bg-[#1c133b] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {STATUS_LABELS[incident.status] ?? incident.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#1c133b]">
                    {incident.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5a5470]">
                    {new Date(incident.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {incident.severity !== "standard"
                      ? ` · ${incident.severity === "emergency" ? "Emergency" : "Urgent"}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border-2 border-dashed border-[#1c133b]/30 bg-[#f9f6ef] p-5 text-sm text-[#5a5470]">
              No reports yet. If something goes wrong on a job, you can report
              it here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
