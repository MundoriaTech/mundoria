import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  activateEmergencyList,
  markReservePromoted,
  notifyCustomerCleanerChanged,
} from "@/lib/matching/emergency-list";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ response: z.enum(["accepted", "declined"]) });

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const bookingId = params.id;

  if (parsed.data.response === "accepted") {
    const { data: previous } = await admin
      .from("bookings")
      .select(
        "cleaner_id,previous_cleaner_id,cleaner:profiles!bookings_cleaner_id_fkey(full_name)",
      )
      .eq("id", bookingId)
      .maybeSingle();

    const { data: booking } = await admin
      .from("bookings")
      .update({ cleaner_id: user.id, status: "confirmed" })
      .eq("id", bookingId)
      .in("status", ["pending_match", "matched"])
      .or(`cleaner_id.is.null,cleaner_id.eq.${user.id}`)
      .select("id")
      .maybeSingle();

    if (!booking) {
      return NextResponse.json(
        { error: "This job is no longer available." },
        { status: 409 },
      );
    }

    await admin.from("matching_decisions").insert({
      booking_id: bookingId,
      cleaner_id: user.id,
      decision: "offer_accepted",
      reasons: { source: "cleaner_job_feed" },
    });

    const { data: onList } = await admin
      .from("booking_emergency_list")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("cleaner_id", user.id)
      .maybeSingle();
    if (onList) {
      await markReservePromoted(bookingId, user.id);
    }

    const previousCleaner = previous?.cleaner;
    let previousName: string | null = null;
    if (Array.isArray(previousCleaner)) {
      previousName = previousCleaner[0]?.full_name ?? null;
    } else if (previousCleaner && typeof previousCleaner === "object") {
      previousName =
        "full_name" in previousCleaner
          ? ((previousCleaner as { full_name?: string }).full_name ?? null)
          : null;
    }
    if (
      previous?.previous_cleaner_id ||
      (previous?.cleaner_id && previous.cleaner_id !== user.id)
    ) {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      await notifyCustomerCleanerChanged(
        bookingId,
        previousName,
        profile?.full_name ?? null,
      );
    }
  }

  await admin.from("cleaner_job_responses").upsert(
    {
      booking_id: bookingId,
      cleaner_id: user.id,
      responded_at: new Date().toISOString(),
      response: parsed.data.response,
    },
    { onConflict: "booking_id,cleaner_id" },
  );

  if (parsed.data.response === "declined") {
    const { data: cp } = await admin
      .from("cleaner_profiles")
      .select("acceptance_rate")
      .eq("id", user.id)
      .single();
    await admin
      .from("cleaner_profiles")
      .update({
        acceptance_rate: Math.max(0, Number(cp?.acceptance_rate ?? 100) - 2),
      })
      .eq("id", user.id);

    const { data: booking } = await admin
      .from("bookings")
      .select("cleaner_id,status")
      .eq("id", bookingId)
      .single();

    const wasAssigned =
      booking?.cleaner_id === user.id &&
      ["matched", "confirmed"].includes(booking.status);

    await admin
      .from("booking_emergency_list")
      .update({
        removed_reason: "declined_offer",
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)
      .eq("cleaner_id", user.id)
      .in("status", ["reserve", "notified"]);

    if (wasAssigned) {
      await activateEmergencyList(bookingId, {
        excludeCleanerIds: [user.id],
      });
    }
  }

  return NextResponse.json({ success: true });
}
