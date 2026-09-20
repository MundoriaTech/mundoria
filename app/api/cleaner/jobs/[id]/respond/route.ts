import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  activateEmergencyList,
  markReservePromoted,
  notifyCustomerCleanerChanged,
} from "@/lib/matching/emergency-list";
import { sendPushNotification } from "@/lib/notifications/send";
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
      .select(
        "id,customer_id,scheduled_date,scheduled_start_time,service_type,address:addresses(address_line_1,city,postcode),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
      )
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

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const cleanerName = profile?.full_name ?? "Your Mundoria cleaner";

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
      await notifyCustomerCleanerChanged(
        bookingId,
        previousName,
        cleanerName,
      );
    } else {
      await notifyCustomerSessionConfirmed(bookingId, booking, cleanerName);
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

async function notifyCustomerSessionConfirmed(
  bookingId: string,
  booking: {
    customer_id: string;
    scheduled_date: string;
    scheduled_start_time: string;
    service_type: string;
    address:
      | { address_line_1?: string; city?: string; postcode?: string }
      | { address_line_1?: string; city?: string; postcode?: string }[]
      | null;
    customer:
      | {
          email?: string | null;
          full_name?: string | null;
          notification_preferences?: { email?: boolean } | null;
        }
      | {
          email?: string | null;
          full_name?: string | null;
          notification_preferences?: { email?: boolean } | null;
        }[]
      | null;
  },
  cleanerName: string,
) {
  const firstName = cleanerName.split(" ")[0] || "Your cleaner";
  const admin = createAdminClient();
  const address = Array.isArray(booking.address)
    ? booking.address[0]
    : booking.address;
  const customer = Array.isArray(booking.customer)
    ? booking.customer[0]
    : booking.customer;
  const preferences = customer?.notification_preferences as
    | { email?: boolean }
    | undefined;

  await Promise.all([
    sendPushNotification(
      booking.customer_id,
      "Your session is confirmed",
      `${firstName} has accepted your booking.`,
      { booking_id: bookingId },
    ),
    admin.from("notifications").insert({
      body: `${firstName} has accepted your booking.`,
      data: { booking_id: bookingId },
      title: "Your session is confirmed",
      type: "session_confirmed",
      user_id: booking.customer_id,
    }),
  ]);

  if (!customer?.email || preferences?.email === false) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendBrandedEmail({
    data: {
      address: address
        ? `${address.address_line_1}, ${address.city}, ${address.postcode}`
        : undefined,
      appUrl,
      bookingId,
      bookingUrl: `${appUrl}/booking/${bookingId}`,
      cleanerName,
      firstName: customer.full_name?.split(" ")[0],
      fullName: customer.full_name,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_start_time?.slice(0, 5),
      serviceName: String(booking.service_type).replaceAll("_", " "),
    },
    template: "customer.session_confirmed",
    to: customer.email,
  });
}
