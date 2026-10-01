import { createAdminClient } from "@/lib/supabase/admin";

export async function listTakenInterviewSlots(exceptCleanerId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("cleaner_profiles")
    .select("interview_scheduled_at")
    .not("interview_scheduled_at", "is", null)
    .in("interview_status", ["awaiting", "completed"]);
  if (exceptCleanerId) query = query.neq("id", exceptCleanerId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data
    .map((row) => row.interview_scheduled_at as string | null)
    .filter((value): value is string => Boolean(value));
}
