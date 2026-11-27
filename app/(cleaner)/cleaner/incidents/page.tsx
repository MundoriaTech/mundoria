import Link from "next/link";
import { redirect } from "next/navigation";

import {
  IncidentReportForm,
  type IncidentBookingOption,
} from "@/components/cleaner/incident-report-form";
import { SectionHeading } from "@/components/customer/dashboard/section-banner";
import { PaginationLinks } from "@/components/shared/pagination-controls";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { INCIDENT_CATEGORIES } from "@/lib/cleaner/onboarding-compliance";
import { bookingServiceName } from "@/lib/customer/services";
import { PAGE_SIZES, parsePage, slicePage } from "@/lib/pagination";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Incidents" };

interface IncidentRow {
  category: string;
  created_at: string;
  id: string;
  severity: "standard" | "urgent" | "emergency";
  status: string;
  title: string;
}

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  action_required: { bg: "#FFF5E6", color: "#C17E24", label: "Action required" },
  closed: { bg: "#F0F0F0", color: "#6B6B70", label: "Closed" },
  resolved: { bg: "#E0F4EB", color: "#1A7A4A", label: "Resolved" },
  submitted: { bg: "#EAE7F5", color: "#524096", label: "Submitted" },
  under_review: { bg: "#E8F0FF", color: "#2D5BE3", label: "Under review" },
};

export default async function CleanerIncidentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
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
  const page = parsePage(searchParams.page);
  const pagedIncidents = slicePage(incidents, page, PAGE_SIZES.app);
  const bookings: IncidentBookingOption[] = [...jobs]
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 30)
    .map((job) => ({
      id: job.id,
      label: `${new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )} · ${bookingServiceName(job)}${
        job.address?.city ? ` · ${job.address.city}` : ""
      }`,
    }));

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="m-0 max-w-2xl text-[14px] leading-5 text-[#5F5F66]">
        Tell us about injuries, damage, unsafe conditions, theft or anything
        that worried you on a job. See our{" "}
        <Link
          className="font-semibold text-[#524096] underline-offset-2 hover:underline"
          href="/legal/cleaner-standards"
        >
          Cleaner Standards
        </Link>{" "}
        for more.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)] lg:gap-5">
        <IncidentReportForm bookings={bookings} />

        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
          <SectionHeading title="Your reports" />
          {incidents.length ? (
            <>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {pagedIncidents.map((incident) => {
                  const status =
                    STATUS_PILL[incident.status] ?? STATUS_PILL.submitted!;
                  return (
                    <li
                      className="rounded-[18px] bg-[#F3F4F6] p-4"
                      key={incident.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
                          {INCIDENT_CATEGORIES.find(
                            (item) => item.value === incident.category,
                          )?.label ?? incident.category}
                        </p>
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="m-0 mt-2 text-[14px] font-semibold text-[#1E1848]">
                        {incident.title}
                      </p>
                      <p className="m-0 mt-1 text-[12.5px] text-[#6B6B70]">
                        {new Date(incident.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                        {incident.severity !== "standard"
                          ? ` · ${incident.severity === "emergency" ? "Emergency" : "Urgent"}`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <PaginationLinks
                className="mt-1"
                page={page}
                pageSize={PAGE_SIZES.app}
                pathname="/cleaner/incidents"
                totalItems={incidents.length}
              />
            </>
          ) : (
            <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-12 text-center">
              <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
                No reports yet
              </p>
              <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-5 text-[#6B6B70]">
                If something goes wrong on a job, you can report it here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
