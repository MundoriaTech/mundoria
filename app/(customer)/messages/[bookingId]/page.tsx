import { notFound } from "next/navigation";

import { Chat } from "@/components/customer/chat";
import { createServerClient } from "@/lib/supabase/server";
import type { Message } from "@/types/customer";

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
      .select("customer_id, cleaner_id")
      .eq("id", params.bookingId)
      .eq("customer_id", user!.id)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("booking_id", params.bookingId)
      .order("created_at"),
  ]);
  if (!booking?.cleaner_id) notFound();

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

  return (
    <Chat
      bookingId={params.bookingId}
      currentUserId={user!.id}
      initialMessages={(messages ?? []) as Message[]}
      names={{
        [booking.customer_id]: customer?.full_name ?? "Customer",
        [booking.cleaner_id]: cleaner?.full_name ?? "Cleaner",
      }}
    />
  );
}
