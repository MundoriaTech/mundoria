import { notFound } from "next/navigation";

import { Chat } from "@/components/customer/chat";
import { isCleanerVisibleToCustomer } from "@/lib/customer/booking-visibility";
import { formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { BookingStatus, Message, ServiceType } from "@/types/customer";

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
      .select("customer_id, cleaner_id, status, service_type, scheduled_date")
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
      .select("full_name")
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
      peerLabel={cleanerName}
      subtitle={`${formatServiceName(booking.service_type as ServiceType)} · ${when}`}
    />
  );
}
