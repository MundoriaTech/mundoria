import { BookingWizard } from "@/components/customer/booking-wizard";
import { createServerClient } from "@/lib/supabase/server";
import type { Address, Booking, BookingDraft } from "@/types/customer";

export const metadata = { title: "Book a cleaner" };

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: { rebook?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", user!.id)
    .order("is_default", { ascending: false });
  let initialDraft: Partial<BookingDraft> | undefined;

  if (searchParams.rebook) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", searchParams.rebook)
      .eq("customer_id", user!.id)
      .single();
    const booking = data as Booking | null;

    if (booking) {
      initialDraft = {
        addressId: booking.address_id,
        isRecurring: booking.is_recurring,
        preferSameCleaner: booking.prefer_same_cleaner,
        recurrencePattern: booking.recurrence_pattern,
        serviceType: booking.service_type,
        specialInstructions: booking.special_instructions ?? "",
      };
    }
  }

  return (
    <BookingWizard
      initialAddresses={(addresses ?? []) as Address[]}
      initialDraft={initialDraft}
      userId={user!.id}
    />
  );
}
