import { notFound } from "next/navigation";

import { BookingDetail } from "@/components/customer/booking-detail";
import {
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
} from "@/lib/customer/booking-visibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingChecklistItem,
  CleanerPublicProfile,
} from "@/types/customer";

export default async function CustomerBookingPage({
  params,
}: {
  params: { id: string };
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

  let offerExpiresAt: string | null = null;
  if (isWaitingForCleanerAcceptance(booking.status)) {
    const admin = createAdminClient();
    if (booking.cleaner_id) {
      const { data: offer } = await admin
        .from("cleaner_job_responses")
        .select("expires_at")
        .eq("booking_id", booking.id)
        .eq("cleaner_id", booking.cleaner_id)
        .maybeSingle();
      offerExpiresAt = offer?.expires_at ?? null;
    }
    if (!offerExpiresAt) {
      const created = new Date(booking.created_at).getTime();
      offerExpiresAt = new Date(created + 2 * 60 * 60 * 1000).toISOString();
    }
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

  return (
    <BookingDetail
      customerId={user!.id}
      checklistItems={(checklist ?? []) as BookingChecklistItem[]}
      hasCompletionConfirmation={Boolean(confirmation)}
      hasRating={Boolean(rating)}
      initialBooking={booking}
      offerExpiresAt={offerExpiresAt}
    />
  );
}
