import { redirect } from "next/navigation";

import { isAwaitingApproval } from "@/lib/cleaner/approval";
import { getCleanerContext } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";

/** Applicants see their application status until approved, not this area. */
export default async function ApprovedCleanersOnly({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login/cleaner");
  const { cleanerProfile } = await getCleanerContext(supabase, user.id);
  if (isAwaitingApproval(cleanerProfile)) redirect("/cleaner/dashboard");
  return <>{children}</>;
}
