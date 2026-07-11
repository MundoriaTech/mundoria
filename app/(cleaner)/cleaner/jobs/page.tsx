import { JobFeed } from "@/components/cleaner/job-feed";
import { getAvailableJobs, getCleanerJobs } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";
export default async function CleanerJobsPage(){const s=createServerClient();const {data:{user}}=await s.auth.getUser();const [available,assigned]=await Promise.all([getAvailableJobs(user!.id),getCleanerJobs(user!.id)]);return <div><h1 className="text-3xl font-semibold">Jobs</h1><p className="mt-2 mb-7 text-muted-foreground">Find new work and manage your schedule.</p><JobFeed available={available} assigned={assigned}/></div>}
