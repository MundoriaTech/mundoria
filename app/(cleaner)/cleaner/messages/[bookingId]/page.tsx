import { notFound } from "next/navigation";

import { Chat } from "@/components/customer/chat";
import { bookingServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Message } from "@/types/customer";

export default async function CleanerMessagesPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const [{ data: booking }, { data: teamRow }, { data: messages }] =
    await Promise.all([
      admin
        .from("bookings")
        .select(
          "customer_id,cleaner_id,service_type,is_recurring,scheduled_date,safety_hold_at",
        )
        .eq("id", params.bookingId)
        .maybeSingle(),
      admin
        .from("booking_team_members")
        .select("id")
        .eq("booking_id", params.bookingId)
        .eq("cleaner_id", user!.id)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("*")
        .eq("booking_id", params.bookingId)
        .order("created_at"),
    ]);

  const allowed =
    booking &&
    (booking.cleaner_id === user!.id || Boolean(teamRow));
  if (!booking || !allowed) notFound();

  const participantIds = [
    booking.customer_id,
    booking.cleaner_id,
    user!.id,
  ].filter(Boolean) as string[];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,full_name,avatar_url")
    .in("id", Array.from(new Set(participantIds)));

  const customer = profiles?.find(
    (profile) => profile.id === booking.customer_id,
  );
  const customerName = customer?.full_name ?? "Customer";
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
      names={Object.fromEntries(
        (profiles ?? []).map((profile) => [profile.id, profile.full_name]),
      )}
      peerAvatarUrl={customer?.avatar_url ?? null}
      peerLabel={customerName.split(" ")[0] ?? customerName}
      peerSeed={booking.customer_id}
      safetyHold={Boolean(booking.safety_hold_at)}
      subtitle={`${bookingServiceName(booking)} · ${when}`}
    />
  );
}
