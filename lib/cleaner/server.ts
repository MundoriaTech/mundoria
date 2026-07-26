import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CleanerArea,
  CleanerAvailability,
  CleanerJob,
  CleanerProfile,
  CleanerService,
} from "@/types/cleaner";

export async function getCleanerContext(
  supabase: SupabaseClient,
  cleanerId: string,
) {
  const [
    { data: profile },
    { data: cleanerProfile },
    { data: services },
    { data: areas },
    { data: availability },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", cleanerId).single(),
    supabase.from("cleaner_profiles").select("*").eq("id", cleanerId).single(),
    supabase.from("cleaner_services").select("*").eq("cleaner_id", cleanerId),
    supabase
      .from("cleaner_working_areas")
      .select("*")
      .eq("cleaner_id", cleanerId),
    supabase
      .from("cleaner_availability")
      .select("*")
      .eq("cleaner_id", cleanerId),
  ]);

  return {
    areas: (areas ?? []) as CleanerArea[],
    availability: (availability ?? []) as CleanerAvailability[],
    cleanerProfile: cleanerProfile as CleanerProfile,
    profile,
    services: (services ?? []) as CleanerService[],
  };
}

export async function getCleanerJobs(cleanerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select("*, address:addresses(*), customer:profiles!bookings_customer_id_fkey(full_name,phone)")
    .eq("cleaner_id", cleanerId)
    .order("scheduled_date");
  return (data ?? []) as CleanerJob[];
}

export async function getAvailableJobs(cleanerId: string) {
  const admin = createAdminClient();
  const [{ data: cleaner }, { data: services }, { data: areas }, { data: availability }, { data: responses }] =
    await Promise.all([
      admin.from("cleaner_profiles").select("tier,status").eq("id", cleanerId).single(),
      admin.from("cleaner_services").select("service_type").eq("cleaner_id", cleanerId).eq("is_active", true),
      admin.from("cleaner_working_areas").select("postcode_prefix").eq("cleaner_id", cleanerId),
      admin.from("cleaner_availability").select("*").eq("cleaner_id", cleanerId).eq("is_available", true),
      admin.from("cleaner_job_responses").select("booking_id,response").eq("cleaner_id", cleanerId),
    ]);
  if (cleaner?.status !== "certified" && cleaner?.status !== "active") return [];
  const { data: bookings } = await admin
    .from("bookings")
    .select("*, address:addresses(*)")
    .eq("status", "pending_match")
    .gte("scheduled_date", new Date().toISOString().slice(0, 10))
    .order("scheduled_date")
    .limit(50);
  const serviceSet = new Set((services ?? []).map((item) => item.service_type));
  const prefixes = (areas ?? []).map((item) => item.postcode_prefix?.toUpperCase()).filter(Boolean) as string[];
  const declined = new Set((responses ?? []).filter((item) => item.response === "declined").map((item) => item.booking_id));
  const tierRank = { bronze: 0, silver: 1, gold: 2, rose_gold: 3, elite: 3 };
  const minimumTier: Record<string, keyof typeof tierRank> = {
    regular: "bronze",
    one_off: "bronze",
    deep_clean: "silver",
    airbnb_turnover: "silver",
    end_of_tenancy: "gold",
    post_construction: "gold",
  };

  return ((bookings ?? []) as CleanerJob[]).filter((booking) => {
    const day = new Date(`${booking.scheduled_date}T12:00:00`).getDay();
    const slot = (availability ?? []).find((item) => item.day_of_week === day);
    const postcode = booking.address?.postcode?.toUpperCase() ?? "";
    return (
      serviceSet.has(booking.service_type) &&
      tierRank[cleaner.tier as keyof typeof tierRank] >=
        tierRank[minimumTier[booking.service_type]] &&
      prefixes.some((prefix) => postcode.startsWith(prefix)) &&
      Boolean(slot) &&
      booking.scheduled_start_time >= slot.start_time &&
      booking.scheduled_start_time <= slot.end_time &&
      !declined.has(booking.id)
    );
  });
}
