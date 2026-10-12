import { JobFeed } from "@/components/cleaner/job-feed";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getAvailableJobs, getCleanerJobs } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";

export default async function CleanerJobsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [available, assigned] = await Promise.all([
    getAvailableJobs(user!.id),
    getCleanerJobs(user!.id),
  ]);

  return (
    <div>
      <LiveDashboardRefresh
        scope={`cleaner-jobs-${user!.id}`}
        watches={bookingWatchesFor("cleaner")}
      />
      <h1 className="text-3xl font-semibold">Jobs</h1>
      <p className="mb-7 mt-2 text-muted-foreground">
        Find new work and manage your schedule.
      </p>
      <JobFeed assigned={assigned} available={available} />
    </div>
  );
}
