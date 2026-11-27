import { notFound } from "next/navigation";

import { Chat } from "@/components/customer/chat";
import { isCleanerVisibleToCustomer } from "@/lib/customer/booking-visibility";
import { bookingServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { CleanerTier } from "@/types/cleaner";
import type { BookingStatus, Message } from "@/types/customer";

export default async function CustomerMessagesPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: booking }, { data: messages }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "customer_id, cleaner_id, status, service_type, is_recurring, scheduled_date, safety_hold_at",
      )
      .eq("id", params.bookingId)
      .eq("customer_id", user!.id)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("booking_id", params.bookingId)
      .order("created_at"),
  ]);
  if (
    !booking?.cleaner_id ||
    !isCleanerVisibleToCustomer(booking.status as BookingStatus)
  ) {
    notFound();
  }

  const [{ data: customer }, { data: cleaner }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.customer_id)
      .single(),
    supabase
      .from("cleaner_public_profiles")
      .select("full_name, avatar_url, tier")
      .eq("id", booking.cleaner_id)
      .single(),
  ]);

  const cleanerName = cleaner?.full_name?.split(" ")[0] ?? "Cleaner";
  const when = new Date(
    `${booking.scheduled_date}T12:00:00`,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Chat
      bookingId={params.bookingId}
      currentUserId={user!.id}
      initialMessages={(messages ?? []) as Message[]}
      names={{
        [booking.customer_id]: customer?.full_name ?? "Customer",
        [booking.cleaner_id]: cleaner?.full_name ?? "Cleaner",
      }}
      peerAvatarUrl={cleaner?.avatar_url ?? null}
      peerLabel={cleanerName}
      peerSeed={booking.cleaner_id}
      peerTier={(cleaner?.tier as CleanerTier | undefined) ?? null}
      safetyHold={Boolean(booking.safety_hold_at)}
      subtitle={`${bookingServiceName(booking)} · ${when}`}
    />
  );
}
