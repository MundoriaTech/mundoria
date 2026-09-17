import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { formatServiceName } from "@/lib/customer/services";
import { getCleanerJobs } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages" };

export default async function CleanerMessagesListPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jobs = await getCleanerJobs(user!.id);
  const conversations = jobs.filter(
    (job) =>
      Boolean(job.customer_id) &&
      !["pending_match", "cancelled"].includes(job.status),
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-2 text-muted-foreground">
        Keep booking details and updates with your customers in one place.
      </p>
      <div className="mt-8 space-y-3">
        {conversations.length ? (
          conversations.map((job) => (
            <Link
              className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm transition hover:border-primary"
              href={`/cleaner/messages/${job.id}`}
              key={job.id}
            >
              <span className="rounded-full bg-emerald-100 p-3 text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {job.customer?.full_name ?? "Customer"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {formatServiceName(job.service_type)} · {job.scheduled_date}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Customer conversations appear here after you’re matched to a job.
          </div>
        )}
      </div>
    </div>
  );
}
