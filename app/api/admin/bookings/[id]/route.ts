import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { runMatchingEngine } from "@/lib/matching/engine";

const schema = z.object({
  action: z.enum(["reassign", "status", "rematch"]),
  cleanerId: z.string().uuid().nullable().optional(),
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

const REMATCHABLE_PAYMENTS = new Set(["held"]);

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
  const { action, cleanerId, note, status } = parsed.data;

  const { data: booking } = await auth.admin
    .from("bookings")
    .select("id,status,payment_status,cleaner_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let updates: Record<string, unknown> = {};
  let excludeCleanerIds: string[] = [];

  if (action === "reassign") {
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
    if (!REMATCHABLE_PAYMENTS.has(booking.payment_status)) {
      return NextResponse.json(
        {
          error:
            "Only bookings with an active payment hold can be rematched. Refunded or unpaid bookings cannot re-enter matching.",
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
    updates = { status };
  }

  const { error } = await auth.admin
    .from("bookings")
    .update(updates)
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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
