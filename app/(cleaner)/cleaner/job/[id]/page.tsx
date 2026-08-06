import { notFound } from "next/navigation";

import { JobDetail } from "@/components/cleaner/job-detail";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { CleanerJob } from "@/types/cleaner";
import type { BookingAddOn } from "@/types/customer";

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
  const [{ data }, { data: addOns }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,phone)",
      )
      .eq("id", params.id)
      .eq("cleaner_id", user!.id)
      .single(),
    admin
      .from("booking_add_ons")
      .select("*")
      .eq("booking_id", params.id)
      .order("created_at"),
  ]);

  if (!data) notFound();

  const job = data as CleanerJob;
  job.add_ons = (addOns ?? []) as BookingAddOn[];

  return <JobDetail initialJob={job} />;
}
