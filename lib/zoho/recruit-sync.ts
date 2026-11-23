import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanerRecruitFields } from "@/lib/zoho/recruit-mapping";
import { upsertZohoCandidate } from "@/lib/zoho/recruit";
import type { CleanerArea, CleanerAvailability, CleanerProfile, CleanerService } from "@/types/cleaner";

/** Read the saved website record; never trust applicant-supplied Zoho field names. */
export async function syncCleanerToRecruit(admin: SupabaseClient, cleanerId: string) {
  if (process.env.ZOHO_RECRUIT_PROFILE_SYNC_ENABLED !== "true") return { status: "skipped" as const };
  try {
    const [profile, cleaner, areas, availability, services] = await Promise.all([
      admin.from("profiles").select("id,role,email,full_name,phone").eq("id", cleanerId).single(),
      admin.from("cleaner_profiles").select("*").eq("id", cleanerId).single(),
      admin.from("cleaner_working_areas").select("*").eq("cleaner_id", cleanerId),
      admin.from("cleaner_availability").select("*").eq("cleaner_id", cleanerId),
      admin.from("cleaner_services").select("*").eq("cleaner_id", cleanerId),
    ]);
    if ([profile, cleaner, areas, availability, services].some(result => result.error)) throw new Error("Recruit sync source read failed");
    if (profile.data?.role !== "cleaner" || !cleaner.data) return { status: "skipped" as const };
    return await upsertZohoCandidate({
      email: profile.data.email, fullName: profile.data.full_name,
      phone: profile.data.phone, userId: cleanerId,
    }, { applicationReference: cleaner.data.application_reference || undefined, applicationSubmitted: !!cleaner.data.onboarding_complete },
    cleanerRecruitFields(cleaner.data as CleanerProfile, areas.data as CleanerArea[], availability.data as CleanerAvailability[], services.data as CleanerService[]));
  } catch (error) {
    Sentry.captureException(error);
    return { status: "failed" as const };
  }
}
