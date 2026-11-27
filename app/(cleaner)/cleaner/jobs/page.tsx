import { JobFeed } from "@/components/cleaner/job-feed";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getAvailableJobs, getCleanerJobs } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Jobs" };

export default async function CleanerJobsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [available, assigned] = await Promise.all([
    getAvailableJobs(user!.id),
    getCleanerJobs(user!.id),
  ]);

  const hasOngoing = assigned.some((job) =>
    ["cleaner_en_route", "in_progress", "awaiting_customer_confirmation", "disputed"].includes(
      job.status,
    ),
  );
  const initialTab = available.length
    ? "available"
    : hasOngoing
      ? "ongoing"
      : "upcoming";

  return (
    <div>
      <LiveDashboardRefresh
        scope={`cleaner-jobs-${user!.id}`}
        watches={bookingWatchesFor("cleaner")}
      />
      <JobFeed
        assigned={assigned}
        available={available}
        initialTab={initialTab}
      />
    </div>
  );
}
