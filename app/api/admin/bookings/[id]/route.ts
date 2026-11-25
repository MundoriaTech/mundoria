import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  ensureCaptureScheduled,
  recordArrival,
  recordCheckout,
} from "@/lib/bookings/geofence";
import { runMatchingEngine } from "@/lib/matching/engine";
import { refundBookingPayment } from "@/lib/payments/service";
import { filterCleanersForBooking } from "@/lib/matching/seed-accounts";
import { maybeAuthorizeBookingIfDue } from "@/lib/payments/lifecycle";

const schema = z.object({
  action: z.enum([
    "reassign",
    "status",
    "rematch",
    "assignTeam",
    "approve_checkin",
    "approve_checkout",
  ]),
  cleanerId: z.string().uuid().nullable().optional(),
  cleanerIds: z.array(z.string().uuid()).max(8).optional(),
  note: z.string().trim().min(3),
  status: z
    .enum([
      "pending_match",
      "matched",
      "confirmed",
      "cleaner_en_route",
      "in_progress",
      "awaiting_customer_confirmation",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
});

const REMATCHABLE_PAYMENTS = new Set(["unpaid", "held", "released"]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const { action, cleanerId, cleanerIds, note, status } = parsed.data;

  const { data: booking } = await auth.admin
    .from("bookings")
    .select(
      "id,status,payment_status,cleaner_id,allocated_cleaners,checkin_verified,actual_start_time,actual_end_time,arrived_at,stripe_payment_method_id,stripe_payment_intent_id",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (action === "approve_checkin" || action === "approve_checkout") {
    const eventType = action === "approve_checkin" ? "checkin" : "checkout";
    if (!booking.cleaner_id) {
      return NextResponse.json({ error: "No cleaner on this booking." }, { status: 400 });
    }
    const allowed =
      eventType === "checkin"
        ? ["confirmed", "cleaner_en_route"].includes(booking.status) && !booking.arrived_at
        : booking.status === "in_progress";
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            eventType === "checkin"
              ? "Arrival can be accepted only before the clean starts."
              : "Finish can be accepted only while the clean is in progress.",
        },
        { status: 400 },
      );
    }
    const { data: request } = await auth.admin
      .from("location_override_requests")
      .select("id,latitude,longitude")
      .eq("booking_id", params.id)
      .eq("event_type", eventType)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const latitude = request ? Number(request.latitude) : null;
    const longitude = request ? Number(request.longitude) : null;
    if (eventType === "checkin") {
      if (booking.status === "confirmed") {
        // The cleaner app shows "Start cleaning" for en-route visits.
        await auth.admin
          .from("bookings")
          .update({ status: "cleaner_en_route" })
          .eq("id", params.id);
      }
      await recordArrival({ bookingId: params.id, latitude, longitude });
    } else {
      await recordCheckout({
        bookingId: params.id,
        cleanerId: booking.cleaner_id,
        latitude,
        longitude,
      });
    }
    await auth.admin
      .from("location_override_requests")
      .update({
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
        status: "approved",
      })
      .eq("booking_id", params.id)
      .eq("event_type", eventType)
      .eq("status", "pending");
    await logAdminAction({
      action,
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "booking",
      metadata: { latitude, longitude },
      reason: note,
    });
    return NextResponse.json({ success: true });
  }

  let updates: Record<string, unknown> = {};
  let excludeCleanerIds: string[] = [];

  const requestedCleaners = Array.from(
    new Set([...(cleanerIds ?? []), ...(cleanerId ? [cleanerId] : [])]),
  );
  if (
    (action === "assignTeam" || action === "reassign") &&
    requestedCleaners.length
  ) {
    const allowed = await filterCleanersForBooking(
      auth.admin,
      params.id,
      requestedCleaners,
    );
    if (allowed.length !== requestedCleaners.length) {
      return NextResponse.json(
        {
          error:
            "Test (seed) cleaners can't be assigned to real bookings, and real cleaners can't be assigned to test bookings.",
        },
        { status: 400 },
      );
    }
  }

  if (action === "assignTeam") {
    const ids = Array.from(new Set(cleanerIds ?? []));
    const needed = Math.max(1, Number(booking.allocated_cleaners ?? 1));
    if (!ids.length) {
      return NextResponse.json({ error: "Choose at least one cleaner" }, { status: 400 });
    }
    if (ids.length > needed) {
      return NextResponse.json(
        { error: `This job only needs ${needed} cleaners.` },
        { status: 400 },
      );
    }
    const primary = booking.cleaner_id ?? ids[0]!;
    const teamRows = ids.map((id) => ({
      booking_id: params.id,
      cleaner_id: id,
      role: id === primary ? "primary" : "secondary",
    }));
    await auth.admin.from("booking_team_members").delete().eq("booking_id", params.id);
    const { error: teamError } = await auth.admin
      .from("booking_team_members")
      .insert(teamRows);
    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 400 });
    }
    if (!booking.cleaner_id) {
      updates = { cleaner_id: primary, status: "matched" };
    }
    await auth.admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: primary,
      decision: "admin_team_assignment",
      reasons: { note, team: ids },
    });
  } else if (action === "reassign") {
    if (!cleanerId) {
      return NextResponse.json({ error: "Choose a cleaner" }, { status: 400 });
    }
    updates = { cleaner_id: cleanerId, status: "matched" };
    await auth.admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: cleanerId,
      decision: "admin_override_assignment",
      reasons: { note },
    });
  } else if (action === "rematch") {
    const canRematch =
      REMATCHABLE_PAYMENTS.has(booking.payment_status) &&
      (booking.payment_status !== "unpaid" ||
        Boolean(booking.stripe_payment_method_id));
    if (!canRematch) {
      return NextResponse.json(
        {
          error:
            "Only bookings with a saved card or active payment can be rematched. Refunded bookings cannot re-enter matching.",
        },
        { status: 400 },
      );
    }
    if (booking.cleaner_id) {
      excludeCleanerIds = [booking.cleaner_id];
    }
    updates = {
      cleaner_id: null,
      status: "pending_match",
      checkin_override_requested: false,
      checkout_override_requested: false,
    };
    await auth.admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: null,
      decision: "replacement_requested",
      reasons: { note, previous_cleaner_id: booking.cleaner_id },
    });
  } else {
    if (!status) {
      return NextResponse.json({ error: "Choose a status" }, { status: 400 });
    }
    if (
      status === "in_progress" &&
      !booking.checkin_verified &&
      !booking.actual_start_time &&
      !booking.arrived_at
    ) {
      return NextResponse.json(
        {
          error:
            "A clean is in progress only after the cleaner has arrived. If their check-in failed the location check, use Accept arrival.",
        },
        { status: 400 },
      );
    }
    updates = { status };
    const nowIso = new Date().toISOString();
    if (status === "in_progress" && !booking.actual_start_time) {
      updates.actual_start_time = nowIso;
      updates.checkin_verified = true;
    }
    if (
      (status === "awaiting_customer_confirmation" || status === "completed") &&
      !booking.actual_end_time
    ) {
      updates.actual_end_time = nowIso;
      updates.cleaner_marked_complete_at = nowIso;
    }
    if (status === "cancelled") {
      updates.cancelled_at = nowIso;
      updates.cancellation_reason = note;
    }
  }

  if (Object.keys(updates).length) {
    const { error } = await auth.admin
      .from("bookings")
      .update(updates)
      .eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (
    action === "status" &&
    status &&
    ["confirmed", "cleaner_en_route", "in_progress"].includes(status)
  ) {
    await maybeAuthorizeBookingIfDue(params.id).catch(() => undefined);
  }

  // Payment follows the admin's status change.
  if (
    action === "status" &&
    (status === "awaiting_customer_confirmation" || status === "completed") &&
    booking.status !== "awaiting_customer_confirmation" &&
    booking.status !== "completed"
  ) {
    // Finished visits are charged next day, as with a normal check-out.
    await ensureCaptureScheduled(params.id, booking.payment_status);
  }
  if (
    action === "status" &&
    status === "cancelled" &&
    booking.payment_status === "held" &&
    booking.stripe_payment_intent_id
  ) {
    // Cancelling here releases the card hold (no charge).
    await refundBookingPayment(params.id).catch(() => undefined);
  }

  let matchResult: unknown = null;
  if (action === "rematch") {
    try {
      matchResult = await runMatchingEngine(params.id, { excludeCleanerIds });
    } catch (matchError) {
      return NextResponse.json(
        {
          error:
            matchError instanceof Error
              ? matchError.message
              : "Rematch saved, but matching failed to run.",
          rematched: true,
        },
        { status: 400 },
      );
    }
  }

  await logAdminAction({
    action,
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "booking",
    metadata: { cleanerId, status, matchResult },
    reason: note,
  });
  return NextResponse.json({ success: true, matchResult });
}
