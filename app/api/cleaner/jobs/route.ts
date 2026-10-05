import { getCleanerJobs } from "@/lib/cleaner/server";
import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await getCleanerJobs(user.id);
  return NextResponse.json({
    jobs: jobs.map((job) => {
      const address = Array.isArray(job.address) ? job.address[0] : job.address;
      return {
        address: {
          city: address?.city ?? null,
          postcode: address?.postcode ?? null,
        },
        amount_cleaner: job.amount_cleaner,
        id: job.id,
        is_recurring: job.is_recurring,
        scheduled_date: job.scheduled_date,
        scheduled_start_time: job.scheduled_start_time,
        service_type: job.service_type,
        status: job.status,
      };
    }),
  });
}
