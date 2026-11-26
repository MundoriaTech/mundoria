import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerExtraTime } from "@/components/shared/extra-time";
import type { ExtraTimeRow } from "@/lib/bookings/extra-time";
import { matchCutoffAt } from "@/lib/bookings/match-cutoff";
import { notFound } from "next/navigation";

import { BookingDetail } from "@/components/customer/booking-detail";
import {
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
} from "@/lib/customer/booking-visibility";
import { getPaymentTimingSettings } from "@/lib/payments/lifecycle";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingChecklistItem,
  CleanerPublicProfile,
} from "@/types/customer";
import { CleanCountdown } from "@/components/shared/clean-countdown";

export default async function CustomerBookingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { series?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data }, { data: rating }, { data: checklist }, { data: confirmation }, { data: addOns }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, address:addresses(*)")
      .eq("id", params.id)
      .eq("customer_id", user!.id)
      .single(),
    supabase
      .from("ratings")
      .select("id")
      .eq("booking_id", params.id)
      .maybeSingle(),
    supabase
      .from("booking_checklist_items")
      .select("*")
      .eq("booking_id", params.id)
      .order("sort_order"),
    supabase
      .from("booking_completion_confirmations")
      .select("id")
      .eq("booking_id", params.id)
      .maybeSingle(),
    supabase
      .from("booking_add_ons")
      .select("*")
      .eq("booking_id", params.id)
      .order("created_at"),
  ]);

  if (!data) notFound();
  const booking = data as Booking;
  booking.add_ons = (addOns ?? []) as Booking["add_ons"];

  // When nobody has accepted yet, show the cutoff: by then a cleaner has
  // accepted, or the visit is cancelled at no charge and the customer told.
  const { data: extraTime } = await createAdminClient()
    .from("booking_time_extensions").select("id,minutes,amount_pence,reason,status,created_at,decided_at").eq("booking_id", booking.id).order("created_at", { ascending: false });
  let offerExpiresAt: string | null = null;
  if (isWaitingForCleanerAcceptance(booking.status)) {
    // Protected bookings are never cancelled automatically: no cutoff shown.
    offerExpiresAt = (booking as { auto_cancel_exempt?: boolean }).auto_cancel_exempt
      ? null
      : (matchCutoffAt(booking)?.toISOString() ?? null);
  }

  if (booking.cleaner_id && isCleanerVisibleToCustomer(booking.status)) {
    const { data: cleaner } = await supabase
      .from("cleaner_public_profiles")
      .select("*")
      .eq("id", booking.cleaner_id)
      .maybeSingle();
    booking.cleaner = cleaner as CleanerPublicProfile | null;
  } else {
    booking.cleaner = null;
  }

  const paymentTiming = await getPaymentTimingSettings();

  return (
    <>
      {searchParams?.series === "failed" ? (
        <p className="mb-4 rounded-2xl bg-[#fff4e8] px-4 py-3 text-sm text-[#7a3e12]">
          Your first visit is booked. The next visit in the series could not
          be created. It will show in your bookings once it is added, or
          contact support if it does not appear.
        </p>
      ) : null}
    {booking.status === "in_progress" ? (
      <div className="mb-4">
        <CleanCountdown
          bookingId={booking.id}
          durationHours={booking.estimated_duration_hours}
          role="customer"
          startedAt={booking.actual_start_time}
        />
      </div>
    ) : null}
    {(extraTime ?? []).length ? (
      <div className="mb-4">
        <CustomerExtraTime bookingId={booking.id} rows={(extraTime ?? []) as ExtraTimeRow[]} />
      </div>
    ) : null}
    <BookingDetail
      customerId={user!.id}
      freeCancelHours={paymentTiming.payment_preauth_hours_before}
      holdOpenHours={paymentTiming.payment_auth_open_hours_before}
      checklistItems={(checklist ?? []) as BookingChecklistItem[]}
      hasCompletionConfirmation={Boolean(confirmation)}
      hasRating={Boolean(rating)}
      initialBooking={booking}
      offerExpiresAt={offerExpiresAt}
    />
    </>
  );
}
