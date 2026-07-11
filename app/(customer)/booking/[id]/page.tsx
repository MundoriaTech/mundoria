import { notFound } from "next/navigation";

import { BookingDetail } from "@/components/customer/booking-detail";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Booking,
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
  const [{ data }, { data: rating }] = await Promise.all([
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
  ]);

  if (!data) notFound();
  const booking = data as Booking;

  if (booking.cleaner_id) {
    const { data: cleaner } = await supabase
      .from("cleaner_public_profiles")
      .select("*")
      .eq("id", booking.cleaner_id)
      .maybeSingle();
    booking.cleaner = cleaner as CleanerPublicProfile | null;
  }

  return (
    <BookingDetail
      customerId={user!.id}
      hasRating={Boolean(rating)}
      initialBooking={booking}
    />
  );
}
