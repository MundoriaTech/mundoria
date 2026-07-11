import { addMinutes, areIntervalsOverlapping } from "date-fns";

import { getDistanceInMetres } from "@/lib/maps/distance";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const tierRank = { bronze: 0, silver: 1, gold: 2, elite: 3 };

interface MatchingOptions {
  excludeCleanerIds?: string[];
}

export async function runMatchingEngine(
  bookingId: string,
  options: MatchingOptions = {},
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*,address:addresses(*)")
    .eq("id", bookingId)
    .single();
  if (!booking?.address) throw new Error("Booking or address not found.");

  const day = new Date(`${booking.scheduled_date}T12:00:00`).getDay();
  const [{ data: candidates }, { data: existingBookings }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id,onesignal_player_id,cleaner_profiles!inner(tier,status,dbs_verified,working_radius_km),cleaner_services!inner(service_type,is_active),cleaner_availability!inner(day_of_week,start_time,end_time,is_available),cleaner_working_areas(postcode_prefix,latitude,longitude)",
      )
      .eq("role", "cleaner")
      .eq("cleaner_profiles.status", "active")
      .eq("cleaner_profiles.dbs_verified", true)
      .eq("cleaner_services.service_type", booking.service_type)
      .eq("cleaner_services.is_active", true)
      .eq("cleaner_availability.day_of_week", day)
      .eq("cleaner_availability.is_available", true),
    admin
      .from("bookings")
      .select(
        "cleaner_id,scheduled_date,scheduled_start_time,estimated_duration_hours",
      )
      .eq("scheduled_date", booking.scheduled_date)
      .not("cleaner_id", "is", null)
      .not("status", "in", '("cancelled","no_show")'),
  ]);

  const bookingStart = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  );
  const bookingEnd = addMinutes(
    bookingStart,
    Number(booking.estimated_duration_hours ?? 2) * 60,
  );
  const excluded = new Set(options.excludeCleanerIds ?? []);
  const considered = (candidates ?? []).flatMap((candidate) => {
    const cleanerProfile = Array.isArray(candidate.cleaner_profiles)
      ? candidate.cleaner_profiles[0]
      : candidate.cleaner_profiles;
    const availability = Array.isArray(candidate.cleaner_availability)
      ? candidate.cleaner_availability
      : [candidate.cleaner_availability];
    const areas = candidate.cleaner_working_areas ?? [];
    const slotAvailable = availability.some(
      (slot) => {
        const slotStart = new Date(
          `${booking.scheduled_date}T${slot.start_time}`,
        );
        const slotEnd = new Date(
          `${booking.scheduled_date}T${slot.end_time}`,
        );
        return bookingStart >= slotStart && bookingEnd <= slotEnd;
      },
    );
    const conflict = (existingBookings ?? []).some((existing) => {
      if (existing.cleaner_id !== candidate.id) return false;
      const start = new Date(
        `${existing.scheduled_date}T${existing.scheduled_start_time}`,
      );
      const end = addMinutes(
        start,
        Number(existing.estimated_duration_hours ?? 2) * 60,
      );
      return areIntervalsOverlapping(
        { end: bookingEnd, start: bookingStart },
        { end, start },
      );
    });
    const postcodeMatch = areas.some(
      (area) =>
        area.postcode_prefix &&
        booking.address.postcode
          .toUpperCase()
          .startsWith(area.postcode_prefix.toUpperCase()),
    );
    const distances = areas
      .filter(
        (area) =>
          area.latitude != null &&
          area.longitude != null &&
          booking.address.latitude != null &&
          booking.address.longitude != null,
      )
      .map((area) =>
        getDistanceInMetres(
          Number(area.latitude),
          Number(area.longitude),
          Number(booking.address.latitude),
          Number(booking.address.longitude),
        ),
      );
    const distance = distances.length ? Math.min(...distances) : postcodeMatch ? 0 : Infinity;
    const inRadius =
      distance <= Number(cleanerProfile.working_radius_km ?? 10) * 1000;
    const eligible =
      !excluded.has(candidate.id) &&
      slotAvailable &&
      !conflict &&
      (postcodeMatch || inRadius);
    return [
      {
        cleanerId: candidate.id,
        distance,
        eligible,
        playerId: candidate.onesignal_player_id as string | null,
        preferred: booking.preferred_cleaner_id === candidate.id,
        reasons: {
          conflict,
          distance_metres: Number.isFinite(distance) ? Math.round(distance) : null,
          excluded: excluded.has(candidate.id),
          in_radius: inRadius,
          postcode_match: postcodeMatch,
          slot_available: slotAvailable,
        },
        tier: cleanerProfile.tier as keyof typeof tierRank,
      },
    ];
  });

  const ranked = considered
    .filter((candidate) => candidate.eligible)
    .sort(
      (left, right) =>
        Number(right.preferred) - Number(left.preferred) ||
        tierRank[right.tier] - tierRank[left.tier] ||
        left.distance - right.distance,
    );
  const winner = ranked[0];

  await admin.from("matching_decisions").insert(
    considered.map((candidate) => ({
      booking_id: bookingId,
      cleaner_id: candidate.cleanerId,
      decision:
        candidate.cleanerId === winner?.cleanerId
          ? "selected"
          : candidate.eligible
            ? "ranked_below_selected"
            : "ineligible",
      reasons: candidate.reasons,
      score:
        (candidate.preferred ? 10_000 : 0) +
        tierRank[candidate.tier] * 1_000 -
        (Number.isFinite(candidate.distance) ? candidate.distance / 100 : 10_000),
    })),
  );

  if (!winner) {
    await admin
      .from("bookings")
      .update({ cleaner_id: null, status: "pending_match" })
      .eq("id", bookingId);
    await alertAdmins(
      "matching_failed",
      "No cleaner available",
      `Booking ${bookingId.slice(0, 8)} remains unmatched.`,
      { booking_id: bookingId },
    );
    return { considered, matched: false as const };
  }

  const { data: assigned } = await admin
    .from("bookings")
    .update({ cleaner_id: winner.cleanerId, status: "matched" })
    .eq("id", bookingId)
    .in("status", ["pending_match", "no_show"])
    .select("id")
    .maybeSingle();
  if (!assigned) return { considered, matched: false as const };

  await admin.from("cleaner_job_responses").upsert(
    {
      booking_id: bookingId,
      cleaner_id: winner.cleanerId,
      expires_at: addMinutes(new Date(), 30).toISOString(),
      offered_at: new Date().toISOString(),
      response: "expired",
    },
    { onConflict: "booking_id,cleaner_id" },
  );
  await Promise.all([
    sendPushNotification(
      winner.cleanerId,
      "New cleaning job",
      `A ${booking.service_type.replaceAll("_", " ")} job is waiting for you.`,
      { booking_id: bookingId },
    ),
    sendPushNotification(
      booking.customer_id,
      "We found your cleaner",
      "A cleaner has been matched to your booking.",
      { booking_id: bookingId },
    ),
  ]);
  return { cleanerId: winner.cleanerId, considered, matched: true as const };
}
