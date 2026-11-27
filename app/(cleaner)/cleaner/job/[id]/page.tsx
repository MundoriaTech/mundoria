import { CleanerExtraTime } from "@/components/shared/extra-time";
import type { ExtraTimeRow } from "@/lib/bookings/extra-time";
import { notFound } from "next/navigation";

import { JobDetail } from "@/components/cleaner/job-detail";
import { cleanerPayForDisplay } from "@/lib/cleaner/pay-display";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { CleanerJob } from "@/types/cleaner";
import type { BookingAddOn } from "@/types/customer";
import { CleanCountdown } from "@/components/shared/clean-countdown";

export default async function CleanerJobPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const [{ data }, { data: teamRow }, { data: addOns }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,phone,avatar_url)",
      )
      .eq("id", params.id)
      .maybeSingle(),
    admin
      .from("booking_team_members")
      .select("role")
      .eq("booking_id", params.id)
      .eq("cleaner_id", user!.id)
      .maybeSingle(),
    admin
      .from("booking_add_ons")
      .select("*")
      .eq("booking_id", params.id)
      .order("created_at"),
  ]);

  const allowed =
    data && (data.cleaner_id === user!.id || Boolean(teamRow));
  if (!data || !allowed) notFound();

  const job = data as CleanerJob;
  job.add_ons = (addOns ?? []) as BookingAddOn[];
  if (
    teamRow?.role === "secondary" &&
    job.amount_cleaner &&
    job.allocated_cleaners
  ) {
    job.amount_cleaner = Math.floor(
      job.amount_cleaner / Math.max(1, job.allocated_cleaners),
    );
  }
  job.amount_cleaner = await cleanerPayForDisplay(job.id, user!.id, job.amount_cleaner);

  const { data: extraTime } = await createAdminClient()
    .from("booking_time_extensions").select("id,minutes,amount_pence,reason,status,created_at,decided_at").eq("booking_id", job.id).order("created_at", { ascending: false });
  const extensionPending = (extraTime ?? []).some((row) => row.status === "pending");
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {job.status === "in_progress" ? (
        <CleanCountdown
          bookingId={job.id}
          durationHours={job.estimated_duration_hours}
          extensionPending={extensionPending}
          role="cleaner"
          startedAt={job.actual_start_time}
        />
      ) : null}
      <JobDetail initialJob={job} />
      {data.cleaner_id === user!.id ? (
        <CleanerExtraTime
          bookingId={job.id}
          inProgress={job.status === "in_progress"}
          rows={(extraTime ?? []) as ExtraTimeRow[]}
        />
      ) : null}
    </div>
  );
}
