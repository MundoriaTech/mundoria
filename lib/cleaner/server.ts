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
    agreement_acceptances: Array.isArray(row.agreement_acceptances)
      ? row.agreement_acceptances
      : [],
    application_reference: row.application_reference ?? null,
    booking_preferences: row.booking_preferences ?? [],
    cleaning_skills: row.cleaning_skills ?? [],
    cleaning_skills_other: row.cleaning_skills_other ?? null,
    dbs_certificate_number: row.dbs_certificate_number ?? null,
    dbs_document_status: row.dbs_document_status ?? "missing",
    dbs_issued_on: row.dbs_issued_on ?? null,
    dbs_path: row.dbs_path ?? null,
    emergency_contact: row.emergency_contact ?? null,
    equipment_condition: row.equipment_condition ?? null,
    equipment_other: row.equipment_other ?? null,
    equipment_owned: row.equipment_owned ?? [],
    equipment_ownership: row.equipment_ownership ?? null,
    equipment_status: row.equipment_status ?? null,
    equipment_transport: row.equipment_transport ?? null,
    experience_band: row.experience_band ?? null,
    info_accuracy_confirmed_at: row.info_accuracy_confirmed_at ?? null,
    insurance_activity_confirmed: row.insurance_activity_confirmed ?? null,
    insurance_insured_name: row.insurance_insured_name ?? null,
    gender: row.gender === "woman" || row.gender === "man" ? row.gender : null,
    headshot_status: row.headshot_status ?? "missing",
    headshot_url: row.headshot_url ?? null,
    insurance_certificate_url: row.insurance_certificate_url ?? null,
    insurance_cover_amount: row.insurance_cover_amount ?? null,
    insurance_expiry_date: row.insurance_expiry_date ?? null,
    insurance_path: row.insurance_path ?? null,
    insurance_policy_number: row.insurance_policy_number ?? null,
    insurance_provider: row.insurance_provider ?? null,
    insurance_status: row.insurance_status ?? "missing",
    interview_completed_at: row.interview_completed_at ?? null,
    interview_completed_by: row.interview_completed_by ?? null,
    interview_notes: row.interview_notes ?? null,
    interview_scheduled_at: row.interview_scheduled_at ?? null,
    interview_status: row.interview_status ?? "not_started",
    marketing_consent_at: row.marketing_consent_at ?? null,
    ppe_other: row.ppe_other ?? null,
    ppe_owned: row.ppe_owned ?? [],
    preferred_hours_band: row.preferred_hours_band ?? null,
    prior_work_duration: row.prior_work_duration ?? null,
    prior_work_employer: row.prior_work_employer ?? null,
    prior_work_summary: row.prior_work_summary ?? null,
    prior_work_type: row.prior_work_type ?? null,
    products_other: row.products_other ?? null,
    products_owned: row.products_owned ?? [],
    products_ownership: row.products_ownership ?? null,
    reference_company: row.reference_company ?? null,
    reference_contact_ok: row.reference_contact_ok ?? null,
    reference_email: row.reference_email ?? null,
    reference_name: row.reference_name ?? null,
    reference_phone: row.reference_phone ?? null,
    reference_relationship: row.reference_relationship ?? null,
    safety_acknowledged_at: row.safety_acknowledged_at ?? null,
    skills_assessment_status: row.skills_assessment_status ?? null,
    skills_exam_completed_at: row.skills_exam_completed_at ?? null,
    skills_exam_passed: Boolean(row.skills_exam_passed),
    skills_exam_score: row.skills_exam_score ?? null,
    specialised_equipment: row.specialised_equipment ?? [],
    specialised_other: row.specialised_other ?? null,
    specialised_training: row.specialised_training ?? null,
    specialist_review_required: Boolean(row.specialist_review_required),
    starting_postcode: row.starting_postcode ?? null,
    training_certificate_url: row.training_certificate_url ?? null,
    training_completed: row.training_completed ?? [],
    training_path: row.training_path ?? null,
    transport_mode: row.transport_mode ?? null,
    can_transport_equipment: row.can_transport_equipment ?? null,
    verification_flags:
      row.verification_flags &&
      typeof row.verification_flags === "object" &&
      !Array.isArray(row.verification_flags)
        ? (row.verification_flags as Record<string, unknown>)
        : {},
    utr_document_status: row.utr_document_status ?? "missing",
    utr_document_url: row.utr_document_url ?? null,
    utr_number: row.utr_number ?? null,
    utr_path: row.utr_path ?? null,
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
  try {
    const { settleOutstandingOffers } = await import(
      "@/lib/matching/expire-offers"
    );
    await settleOutstandingOffers({ cleanerId });
  } catch {
    // Offer repair must not hide the rest of the job feed.
  }
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

  const nowIso = new Date().toISOString();
  const { data: openOfferRows } = await admin
    .from("cleaner_job_responses")
    .select("expires_at, bookings(*, address:addresses(*))")
    .eq("cleaner_id", cleanerId)
    .eq("response", "expired")
    .is("responded_at", null)
    .gt("expires_at", nowIso);

  const openOffers: CleanerJob[] = [];
  for (const row of openOfferRows ?? []) {
    const booking = (
      Array.isArray(row.bookings) ? row.bookings[0] : row.bookings
    ) as CleanerJob | null;
    if (!booking) continue;
    if (booking.cleaner_id !== cleanerId) continue;
    if (!["matched", "pending_match"].includes(booking.status)) continue;
    openOffers.push({
      ...booking,
      offer_expires_at: row.expires_at as string,
    });
  }
  const offeredIds = new Set(openOffers.map((job) => job.id));

  const primaryOffers = ((pending ?? []) as CleanerJob[])
    .filter(eligible)
    .filter((job) => !offeredIds.has(job.id));

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

  return [
    ...openOffers,
    ...teamOffers.filter((job) => !offeredIds.has(job.id)),
    ...primaryOffers,
  ];
}
