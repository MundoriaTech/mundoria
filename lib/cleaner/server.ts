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
    cleanerProfile: normalizeCleanerProfile(cleanerProfile),
    profile,
    services: (services ?? []) as CleanerService[],
  };
}

function normalizeCleanerProfile(
  row: CleanerProfile | null,
): CleanerProfile | null {
  if (!row) return null;
  return {
    ...row,
    headshot_status: row.headshot_status ?? "missing",
    headshot_url: row.headshot_url ?? null,
    interview_completed_at: row.interview_completed_at ?? null,
    interview_completed_by: row.interview_completed_by ?? null,
    interview_notes: row.interview_notes ?? null,
    interview_status: row.interview_status ?? "not_started",
    skills_exam_completed_at: row.skills_exam_completed_at ?? null,
    skills_exam_passed: Boolean(row.skills_exam_passed),
    skills_exam_score: row.skills_exam_score ?? null,
    utr_number: row.utr_number ?? null,
    utr_verified: Boolean(row.utr_verified),
  };
}

export async function getCleanerJobs(cleanerId: string) {
  const admin = createAdminClient();
  const [{ data: primary }, { data: team }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "*, address:addresses(*), customer:profiles!bookings_customer_id_fkey(full_name,phone,avatar_url)",
      )
      .eq("cleaner_id", cleanerId)
      .order("scheduled_date"),
    admin
      .from("booking_team_members")
      .select("booking_id")
      .eq("cleaner_id", cleanerId),
  ]);

  const teamIds = (team ?? [])
    .map((row) => row.booking_id as string)
    .filter((id) => !(primary ?? []).some((job) => job.id === id));

  let secondary: CleanerJob[] = [];
  if (teamIds.length) {
    const { data } = await admin
      .from("bookings")
      .select(
        "*, address:addresses(*), customer:profiles!bookings_customer_id_fkey(full_name,phone,avatar_url)",
      )
      .in("id", teamIds)
      .order("scheduled_date");
    secondary = (data ?? []) as CleanerJob[];
  }

  const merged = [...((primary ?? []) as CleanerJob[]), ...secondary];
  merged.sort((a, b) =>
    a.scheduled_date === b.scheduled_date
      ? a.scheduled_start_time.localeCompare(b.scheduled_start_time)
      : a.scheduled_date.localeCompare(b.scheduled_date),
  );
  return merged;
}

export async function getAvailableJobs(cleanerId: string) {
  const admin = createAdminClient();
  const [
    { data: cleaner },
    { data: services },
    { data: areas },
    { data: availability },
    { data: responses },
    { data: teamMemberships },
  ] = await Promise.all([
    admin
      .from("cleaner_profiles")
      .select("tier,status")
      .eq("id", cleanerId)
      .single(),
    admin
      .from("cleaner_services")
      .select("service_type")
      .eq("cleaner_id", cleanerId)
      .eq("is_active", true),
    admin
      .from("cleaner_working_areas")
      .select("postcode_prefix")
      .eq("cleaner_id", cleanerId),
    admin
      .from("cleaner_availability")
      .select("*")
      .eq("cleaner_id", cleanerId)
      .eq("is_available", true),
    admin
      .from("cleaner_job_responses")
      .select("booking_id,response")
      .eq("cleaner_id", cleanerId),
    admin
      .from("booking_team_members")
      .select("booking_id")
      .eq("cleaner_id", cleanerId),
  ]);
  if (!cleaner || (cleaner.status !== "certified" && cleaner.status !== "active")) {
    return [];
  }

  const cleanerTier = cleaner.tier;

  const [{ data: pending }, { data: teamJobs }] = await Promise.all([
    admin
      .from("bookings")
      .select("*, address:addresses(*)")
      .eq("status", "pending_match")
      .gte("scheduled_date", new Date().toISOString().slice(0, 10))
      .order("scheduled_date")
      .limit(50),
    admin
      .from("bookings")
      .select("*, address:addresses(*)")
      .gt("allocated_cleaners", 1)
      .not("cleaner_id", "is", null)
      .neq("cleaner_id", cleanerId)
      .in("status", ["matched", "confirmed"])
      .gte("scheduled_date", new Date().toISOString().slice(0, 10))
      .order("scheduled_date")
      .limit(50),
  ]);

  const serviceSet = new Set(
    (services ?? []).map((item) => item.service_type),
  );
  const prefixes = (areas ?? [])
    .map((item) => item.postcode_prefix?.toUpperCase())
    .filter(Boolean) as string[];
  const declined = new Set(
    (responses ?? [])
      .filter((item) => item.response === "declined")
      .map((item) => item.booking_id),
  );
  const alreadyOnTeam = new Set(
    (teamMemberships ?? []).map((row) => row.booking_id as string),
  );
  const tierRank = { bronze: 0, silver: 1, gold: 2, rose_gold: 3, elite: 3 };
  const minimumTier: Record<string, keyof typeof tierRank> = {
    regular: "bronze",
    one_off: "bronze",
    same_day: "silver",
    deep_clean: "silver",
    end_of_tenancy: "gold",
    move_in: "gold",
    move_out: "gold",
    airbnb_turnover: "silver",
    holiday_let: "silver",
    serviced_accommodation: "silver",
    post_construction: "gold",
    office: "bronze",
    retail_hospitality: "bronze",
    educational_facility: "silver",
    communal_area: "silver",
    window_cleaning: "bronze",
    pregnancy_support: "silver",
    postpartum: "gold",
    illness_recovery: "gold",
    post_injury: "gold",
    hospital_discharge: "gold",
    bereavement_support: "silver",
  };

  function eligible(booking: CleanerJob) {
    const day = new Date(`${booking.scheduled_date}T12:00:00`).getDay();
    const slot = (availability ?? []).find((item) => item.day_of_week === day);
    if (!slot) return false;
    const postcode = booking.address?.postcode?.toUpperCase() ?? "";
    const requiredTier = minimumTier[booking.service_type] ?? "bronze";
    return (
      serviceSet.has(booking.service_type) &&
      tierRank[cleanerTier as keyof typeof tierRank] >=
        tierRank[requiredTier] &&
      prefixes.some((prefix) => postcode.startsWith(prefix)) &&
      booking.scheduled_start_time >= slot.start_time &&
      booking.scheduled_start_time <= slot.end_time &&
      !declined.has(booking.id)
    );
  }

  const primaryOffers = ((pending ?? []) as CleanerJob[]).filter(eligible);

  const teamOffers: CleanerJob[] = [];
  for (const booking of (teamJobs ?? []) as CleanerJob[]) {
    if (alreadyOnTeam.has(booking.id) || !eligible(booking)) continue;
    const allocated = Number(booking.allocated_cleaners ?? 1);
    const { count } = await admin
      .from("booking_team_members")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", booking.id)
      .eq("role", "secondary");
    if ((count ?? 0) < allocated - 1) {
      teamOffers.push(booking);
    }
  }

  return [...teamOffers, ...primaryOffers];
}
