import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  activateEmergencyList,
  markReservePromoted,
  notifyCustomerCleanerChanged,
} from "@/lib/matching/emergency-list";
import { filterCleanersForBooking } from "@/lib/matching/seed-accounts";
import { getAvailableJobs } from "@/lib/cleaner/server";
import { bookingServiceName } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendPushNotification, sendSMS } from "@/lib/notifications/send";
import { onCleanerAcceptedForPayment } from "@/lib/payments/preauth-flow";
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

  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const bookingId = params.id;

  const { data: cleanerProfile } = await admin
    .from("cleaner_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();
  if (!cleanerProfile || !["certified", "active"].includes(cleanerProfile.status)) {
    return NextResponse.json(
      { error: "Only approved cleaners can respond to jobs." },
      { status: 403 },
    );
  }

  if (parsed.data.response === "accepted") {
    const { data: offer } = await admin
      .from("cleaner_job_responses")
      .select("expires_at, responded_at")
      .eq("booking_id", bookingId)
      .eq("cleaner_id", user.id)
      .maybeSingle();
    if (offer?.responded_at) {
      return NextResponse.json(
        { error: "You have already answered this offer." },
        { status: 409 },
      );
    }
    if (
      offer?.expires_at &&
      new Date(offer.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "This offer has expired." },
        { status: 409 },
      );
    }

    // Accept only a live offer made to this cleaner, or a job their own job
    // board shows them (right services, area, tier, availability, and never
    // a test booking for a real cleaner or the other way round).
    const hasLiveOffer = Boolean(
      offer &&
        !offer.responded_at &&
        offer.expires_at &&
        new Date(offer.expires_at).getTime() > Date.now(),
    );
    const allowed = await filterCleanersForBooking(admin, bookingId, [user.id]);
    const onBoard =
      !hasLiveOffer &&
      allowed.length > 0 &&
      (await getAvailableJobs(user.id)).some((job) => job.id === bookingId);
    if (!allowed.length || (!hasLiveOffer && !onBoard)) {
      return NextResponse.json(
        { error: "This job is no longer available." },
        { status: 409 },
      );
    }

    const { data: previous } = await admin
      .from("bookings")
      .select(
        "cleaner_id,previous_cleaner_id,cleaner:profiles!bookings_cleaner_id_fkey(full_name)",
      )
      .eq("id", bookingId)
      .maybeSingle();

    const { data: booking } = await admin
      .from("bookings")
      .update({ cleaner_id: user.id })
      .eq("id", bookingId)
      .in("status", ["pending_match", "matched"])
      .or(`cleaner_id.is.null,cleaner_id.eq.${user.id}`)
      .select(
        "id,customer_id,scheduled_date,scheduled_start_time,service_type,is_recurring,address:addresses(address_line_1,city,postcode),customer:profiles!bookings_customer_id_fkey(email,full_name,phone,notification_preferences)",
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

    // Provisional accept → awaiting_payment → authorize (or schedule) → confirmed.
    const authResult = await onCleanerAcceptedForPayment(bookingId).catch(
      () => null,
    );

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
    const cleanerChanged =
      (previous?.previous_cleaner_id &&
        previous.previous_cleaner_id !== user.id) ||
      (previous?.cleaner_id && previous.cleaner_id !== user.id);
    if (cleanerChanged) {
      await notifyCustomerCleanerChanged(
        bookingId,
        previousName,
        cleanerName,
      );
    } else if (!authResult?.cancelled) {
      // The confirmation moment: a cleaner has accepted.
      await notifyCustomerCleanerConfirmed(
        bookingId,
        booking,
        cleanerName,
        Boolean(authResult?.authorized),
      );
    }
  }

  if (parsed.data.response === "declined") {
    const { data: current } = await admin
      .from("bookings")
      .select("checkin_verified,actual_start_time")
      .eq("id", bookingId)
      .maybeSingle();
    if (current?.checkin_verified || current?.actual_start_time) {
      return NextResponse.json(
        { error: "This clean has already started." },
        { status: 409 },
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
      ["matched", "awaiting_payment", "confirmed", "cleaner_en_route"].includes(
        booking.status,
      );

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
      const { data: reliability } = await admin
        .from("cleaner_profiles")
        .select("cancellation_count")
        .eq("id", user.id)
        .single();
      await admin
        .from("cleaner_profiles")
        .update({
          cancellation_count: Number(reliability?.cancellation_count ?? 0) + 1,
        })
        .eq("id", user.id);
      await activateEmergencyList(bookingId, {
        excludeCleanerIds: [user.id],
      });
    }
  }

  return NextResponse.json({ success: true });
}

type AcceptedBooking = {
  customer?: unknown;
  customer_id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  service_type: string;
};

async function notifyCustomerCleanerConfirmed(
  bookingId: string,
  booking: AcceptedBooking,
  cleanerName: string,
  alreadyPushed: boolean,
) {
  const firstName = cleanerName.split(" ")[0] || "Your cleaner";
  const admin = createAdminClient();
  const customer = (
    Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  ) as
    | {
        email?: string | null;
        full_name?: string | null;
        notification_preferences?: { email?: boolean; sms?: boolean } | null;
        phone?: string | null;
      }
    | null
    | undefined;
  const prefs = customer?.notification_preferences ?? {};
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const time = String(booking.scheduled_start_time).slice(0, 5);
  const date = new Date(`${booking.scheduled_date}T12:00:00`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", weekday: "long" },
  );
  const line = `${firstName} has accepted your ${bookingServiceName(booking).toLowerCase()} on ${date} at ${time}. Your visit is confirmed.`;

  await Promise.all([
    alreadyPushed
      ? null
      : sendPushNotification(booking.customer_id, "Your cleaner is confirmed", line, {
          booking_id: bookingId,
        }),
    admin.from("notifications").insert({
      body: line,
      data: { booking_id: bookingId },
      title: "Your cleaner is confirmed",
      type: "booking_confirmed",
      user_id: booking.customer_id,
    }),
    customer?.email && prefs.email !== false
      ? sendBrandedEmail({
          data: {
            appUrl,
            bookingId,
            bookingUrl: `${appUrl}/booking/${bookingId}`,
            cleanerName: firstName,
            firstName: customer.full_name?.split(" ")[0],
            fullName: customer.full_name,
            scheduledDate: booking.scheduled_date,
            scheduledTime: time,
            serviceName: bookingServiceName(booking),
          },
          template: "customer.session_confirmed",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    customer?.phone && prefs.sms !== false
      ? sendSMS(
          customer.phone,
          `Mundoria: ${line} Details: ${appUrl}/booking/${bookingId}`,
        ).catch(() => undefined)
      : null,
  ]);
}
