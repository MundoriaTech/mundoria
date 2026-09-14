/**
 * Dynamic Emergency List — booking engine helpers.
 *
 * Rule: one primary holds the booking. Everyone else who was eligible stays
 * in reserve until unavailable or cleaning starts. List size ≠ push size —
 * notify in rank order.
 */

import { addMinutes, areIntervalsOverlapping } from "date-fns";

import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmergencyListStatus =
  | "reserve"
  | "notified"
  | "promoted"
  | "removed"
  | "closed";

export type ConfirmationGate = "none" | "t24" | "t6" | "t1";

const CONFIRMATION_WINDOWS_MINUTES: Record<
  Exclude<ConfirmationGate, "none">,
  number
> = {
  t1: 20,
  t24: 120,
  t6: 45,
};

export function nextConfirmationGate(
  scheduledStart: Date,
  now: Date = new Date(),
): { dueAt: Date; gate: ConfirmationGate } | null {
  const msToStart = scheduledStart.getTime() - now.getTime();
  const hoursToStart = msToStart / (60 * 60 * 1000);

  if (hoursToStart <= 0) return null;
  if (hoursToStart <= 1.25 && hoursToStart > 0.15) {
    return {
      dueAt: addMinutes(now, CONFIRMATION_WINDOWS_MINUTES.t1),
      gate: "t1",
    };
  }
  if (hoursToStart <= 7 && hoursToStart > 5.5) {
    return {
      dueAt: addMinutes(now, CONFIRMATION_WINDOWS_MINUTES.t6),
      gate: "t6",
    };
  }
  if (hoursToStart <= 25 && hoursToStart > 23) {
    return {
      dueAt: addMinutes(now, CONFIRMATION_WINDOWS_MINUTES.t24),
      gate: "t24",
    };
  }
  return null;
}

export async function formEmergencyList(
  bookingId: string,
  primaryCleanerId: string,
  rankedEligibleCleanerIds: string[],
) {
  const admin = createAdminClient();
  const reserves = rankedEligibleCleanerIds.filter(
    (id) => id !== primaryCleanerId,
  );

  await admin
    .from("booking_emergency_list")
    .delete()
    .eq("booking_id", bookingId)
    .neq("status", "promoted");

  if (reserves.length) {
    await admin.from("booking_emergency_list").upsert(
      reserves.map((cleanerId, index) => ({
        booking_id: bookingId,
        cleaner_id: cleanerId,
        rank: index + 1,
        status: "reserve" as const,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "booking_id,cleaner_id" },
    );
  }

  await admin
    .from("bookings")
    .update({ booking_protected: reserves.length > 0 })
    .eq("id", bookingId);

  await logDemandSignals(bookingId, primaryCleanerId, reserves);
  return { reserveCount: reserves.length };
}

async function logDemandSignals(
  bookingId: string,
  primaryCleanerId: string,
  reserveCleanerIds: string[],
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "service_type,scheduled_date,scheduled_start_time,amount_total,address:addresses(postcode)",
    )
    .eq("id", bookingId)
    .single();
  if (!booking) return;

  const address = Array.isArray(booking.address)
    ? booking.address[0]
    : booking.address;
  const postcodeArea =
    typeof address?.postcode === "string"
      ? address.postcode.split(/\s+/)[0]?.toUpperCase() ?? null
      : null;

  const rows = [
    {
      amount_total: booking.amount_total,
      booking_id: bookingId,
      cleaner_id: primaryCleanerId,
      postcode_area: postcodeArea,
      role: "primary",
      scheduled_date: booking.scheduled_date,
      scheduled_start_time: booking.scheduled_start_time,
      service_type: booking.service_type,
    },
    ...reserveCleanerIds.map((cleanerId) => ({
      amount_total: booking.amount_total,
      booking_id: bookingId,
      cleaner_id: cleanerId,
      postcode_area: postcodeArea,
      role: "reserve",
      scheduled_date: booking.scheduled_date,
      scheduled_start_time: booking.scheduled_start_time,
      service_type: booking.service_type,
    })),
  ];

  await admin.from("marketplace_demand_signals").insert(rows);
}

/** Drop reserves who accepted a clashing confirmed job. No reliability penalty. */
export async function pruneEmergencyListConflicts(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("scheduled_date,scheduled_start_time,estimated_duration_hours")
    .eq("id", bookingId)
    .single();
  if (!booking) return { removed: [] as string[] };

  const { data: reserves } = await admin
    .from("booking_emergency_list")
    .select("cleaner_id")
    .eq("booking_id", bookingId)
    .in("status", ["reserve", "notified"]);
  if (!reserves?.length) return { removed: [] as string[] };

  const bookingStart = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  );
  const bookingEnd = addMinutes(
    bookingStart,
    Number(booking.estimated_duration_hours ?? 2) * 60,
  );

  const cleanerIds = reserves.map((row) => row.cleaner_id);
  const { data: otherJobs } = await admin
    .from("bookings")
    .select(
      "cleaner_id,scheduled_date,scheduled_start_time,estimated_duration_hours",
    )
    .eq("scheduled_date", booking.scheduled_date)
    .in("cleaner_id", cleanerIds)
    .in("status", ["confirmed", "matched", "cleaner_en_route", "in_progress"])
    .neq("id", bookingId);

  const removed: string[] = [];
  for (const job of otherJobs ?? []) {
    if (!job.cleaner_id) continue;
    const start = new Date(
      `${job.scheduled_date}T${job.scheduled_start_time}`,
    );
    const end = addMinutes(
      start,
      Number(job.estimated_duration_hours ?? 2) * 60,
    );
    const clashes = areIntervalsOverlapping(
      { end: bookingEnd, start: bookingStart },
      { end, start },
    );
    if (!clashes) continue;
    removed.push(job.cleaner_id);
    await admin
      .from("booking_emergency_list")
      .update({
        removed_reason: "schedule_conflict",
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)
      .eq("cleaner_id", job.cleaner_id)
      .in("status", ["reserve", "notified"]);
  }

  if (removed.length) {
    const { count } = await admin
      .from("booking_emergency_list")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", bookingId)
      .in("status", ["reserve", "notified"]);
    await admin
      .from("bookings")
      .update({ booking_protected: (count ?? 0) > 0 })
      .eq("id", bookingId);
  }

  return { removed };
}

export async function closeEmergencyList(bookingId: string) {
  const admin = createAdminClient();
  await admin
    .from("booking_emergency_list")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId)
    .in("status", ["reserve", "notified"]);
  await admin
    .from("bookings")
    .update({
      booking_protected: false,
      confirmation_due_at: null,
      confirmation_gate: "none",
    })
    .eq("id", bookingId);
}

/**
 * Promote next reserve(s) via ranked push — notify the top available wave
 * first (default wave size 3), first to accept becomes primary.
 */
export async function activateEmergencyList(
  bookingId: string,
  options: {
    excludeCleanerIds?: string[];
    waveSize?: number;
  } = {},
) {
  const admin = createAdminClient();
  await pruneEmergencyListConflicts(bookingId);

  const excluded = new Set(options.excludeCleanerIds ?? []);
  const waveSize = options.waveSize ?? 3;

  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,service_type,status")
    .eq("id", bookingId)
    .single();
  if (!booking) return { notified: [] as string[], promoted: false };

  const { data: reserves } = await admin
    .from("booking_emergency_list")
    .select("cleaner_id,rank")
    .eq("booking_id", bookingId)
    .eq("status", "reserve")
    .order("rank", { ascending: true });

  const wave = (reserves ?? [])
    .filter((row) => !excluded.has(row.cleaner_id))
    .slice(0, waveSize);

  if (!wave.length) {
    // Fall back to full rematch excluding previous primary.
    const { runMatchingEngine } = await import("@/lib/matching/engine");
    const previous = booking.cleaner_id ? [booking.cleaner_id] : [];
    await admin
      .from("bookings")
      .update({
        cleaner_id: null,
        status: "pending_match",
      })
      .eq("id", bookingId);
    const result = await runMatchingEngine(bookingId, {
      excludeCleanerIds: [...previous, ...Array.from(excluded)],
    });
    return { notified: [] as string[], promoted: result.matched };
  }

  await admin
    .from("bookings")
    .update({
      cleaner_id: null,
      status: "pending_match",
    })
    .eq("id", bookingId);

  const notified: string[] = [];
  for (const member of wave) {
    await admin.from("cleaner_job_responses").upsert(
      {
        booking_id: bookingId,
        cleaner_id: member.cleaner_id,
        expires_at: addMinutes(new Date(), 15).toISOString(),
        offered_at: new Date().toISOString(),
        response: "expired",
      },
      { onConflict: "booking_id,cleaner_id" },
    );
    await admin
      .from("booking_emergency_list")
      .update({
        notified_at: new Date().toISOString(),
        status: "notified",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)
      .eq("cleaner_id", member.cleaner_id);

    await sendPushNotification(
      member.cleaner_id,
      "Urgent cleaning available",
      "A cleaning you showed interest in has become available.",
      { booking_id: bookingId, urgent: true },
    );
    await admin.from("matching_decisions").insert({
      booking_id: bookingId,
      cleaner_id: member.cleaner_id,
      decision: "emergency_list_offered",
      reasons: { rank: member.rank, wave: true },
    });
    notified.push(member.cleaner_id);
  }

  await sendPushNotification(
    booking.customer_id,
    "Your booking is protected",
    "We're arranging another CleanScape professional for your booking.",
    { booking_id: bookingId },
  );

  return { notified, promoted: false };
}

export async function markReservePromoted(
  bookingId: string,
  cleanerId: string,
) {
  const admin = createAdminClient();
  await admin
    .from("booking_emergency_list")
    .update({
      status: "promoted",
      updated_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId)
    .eq("cleaner_id", cleanerId);

  const { count } = await admin
    .from("booking_emergency_list")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .in("status", ["reserve", "notified"]);

  await admin
    .from("bookings")
    .update({ booking_protected: (count ?? 0) > 0 })
    .eq("id", bookingId);

  await admin.from("matching_decisions").insert({
    booking_id: bookingId,
    cleaner_id: cleanerId,
    decision: "emergency_list_promoted",
    reasons: { source: "first_to_accept" },
  });
}

export async function notifyCustomerCleanerChanged(
  bookingId: string,
  previousCleanerName: string | null,
  newCleanerName: string | null,
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("customer_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return;

  const previous = previousCleanerName?.split(" ")[0] ?? "Your cleaner";
  const next = newCleanerName?.split(" ")[0] ?? "another CleanScape professional";

  await sendPushNotification(
    booking.customer_id,
    "Your cleaning professional has changed",
    `${previous} is unable to attend, but we have already arranged ${next} for your booking.`,
    { booking_id: bookingId },
  );

  await admin.from("notifications").insert({
    body: `${previous} is unable to attend, but we have already arranged ${next} for your booking.`,
    data: { booking_id: bookingId },
    title: "Your cleaning professional has changed",
    type: "cleaner_changed",
    user_id: booking.customer_id,
  });
}
