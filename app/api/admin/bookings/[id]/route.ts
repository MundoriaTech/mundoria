import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { runMatchingEngine } from "@/lib/matching/engine";

const schema = z.object({
  action: z.enum(["reassign", "status", "rematch", "assignTeam"]),
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

const REMATCHABLE_PAYMENTS = new Set(["held", "released"]);

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
    .select("id,status,payment_status,cleaner_id,allocated_cleaners")
    .eq("id", params.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let updates: Record<string, unknown> = {};
  let excludeCleanerIds: string[] = [];

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
    if (!REMATCHABLE_PAYMENTS.has(booking.payment_status)) {
      return NextResponse.json(
        {
          error:
            "Only paid bookings can be rematched. Refunded or unpaid bookings cannot re-enter matching.",
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

  if (Object.keys(updates).length) {
    const { error } = await auth.admin
      .from("bookings")
      .update(updates)
      .eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
