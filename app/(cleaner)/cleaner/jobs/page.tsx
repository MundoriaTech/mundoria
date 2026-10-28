import { JobFeed } from "@/components/cleaner/job-feed";
import { AppPage } from "@/components/shared/app-page";
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
    <AppPage
      description="Find new work and manage your schedule."
      eyebrow="Work"
      title="Jobs"
    >
      <LiveDashboardRefresh
        scope={`cleaner-jobs-${user!.id}`}
        watches={bookingWatchesFor("cleaner")}
      />
      <JobFeed assigned={assigned} available={available} />
    </AppPage>
  );
}
