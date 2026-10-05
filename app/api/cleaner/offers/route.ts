import { NextResponse } from "next/server";

import { getAvailableJobs } from "@/lib/cleaner/server";
import { getRequestUser } from "@/lib/supabase/request-client";

export async function GET(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await getAvailableJobs(user.id);
  return NextResponse.json({
    offers: jobs.map((job) => ({
      amountCleaner: job.amount_cleaner,
      city: job.address?.city ?? null,
      id: job.id,
      postcode: job.address?.postcode ?? null,
      scheduledDate: job.scheduled_date,
      scheduledStartTime: job.scheduled_start_time,
      serviceType: job.service_type,
      status: job.status,
      team: Boolean(job.cleaner_id && job.cleaner_id !== user.id),
    })),
  });
}
