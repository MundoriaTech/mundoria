import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/customer/services";

/** After primary match, persist primary on the team and invite secondaries. */
export async function offerTeamSlots({
  allocatedCleaners,
  bookingId,
  primaryCleanerId,
  rankedCleanerIds,
  sharePence,
}: {
  allocatedCleaners: number;
  bookingId: string;
  primaryCleanerId: string;
  rankedCleanerIds: string[];
  sharePence: number;
}) {
  const openSlots = Math.max(0, allocatedCleaners - 1);
  if (openSlots <= 0) return { offered: 0, openSlots: 0 };

  const admin = createAdminClient();

  await admin.from("booking_team_members").upsert(
    {
      booking_id: bookingId,
      cleaner_id: primaryCleanerId,
      role: "primary",
    },
    { onConflict: "booking_id,cleaner_id" },
  );

  const { count: filled } = await admin
    .from("booking_team_members")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("role", "secondary");

  const stillOpen = Math.max(0, openSlots - (filled ?? 0));
  if (stillOpen <= 0) return { offered: 0, openSlots: 0 };

  const inviteCount = Math.min(stillOpen * 3, 8);
  const candidates = rankedCleanerIds
    .filter((id) => id !== primaryCleanerId)
    .slice(0, inviteCount);

  for (const cleanerId of candidates) {
    await admin.from("matching_decisions").insert({
      booking_id: bookingId,
      cleaner_id: cleanerId,
      decision: "team_offered",
      reasons: {
        offer_type: "secondary",
        open_slots: stillOpen,
        share_pence: sharePence,
      },
      score: sharePence,
    });

    await createInAppNotification(
      cleanerId,
      "job",
      "Team office job available",
      `Claim a secondary slot · about ${formatMoney(sharePence)} share.`,
      { booking_id: bookingId, offer_type: "secondary" },
    );
    await sendPushNotification(
      cleanerId,
      "Team office job",
      `Secondary slot open — about ${formatMoney(sharePence)}.`,
      { booking_id: bookingId },
    );
  }

  await alertAdmins(
    "multi_cleaner_job",
    "Multi-cleaner office job — team slots open",
    `Booking ${bookingId.slice(0, 8)} needs ${stillOpen} more cleaner(s). Primary matched; secondaries invited to claim.`,
    {
      allocated_cleaners: allocatedCleaners,
      booking_id: bookingId,
      open_slots: stillOpen,
    },
  );

  return { offered: candidates.length, openSlots: stillOpen };
}

export async function claimTeamSlot({
  bookingId,
  cleanerId,
}: {
  bookingId: string;
  cleanerId: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,cleaner_id,allocated_cleaners,amount_cleaner,status")
    .eq("id", bookingId)
    .single();

  if (!booking) throw new Error("Booking not found.");
  if (!booking.cleaner_id) {
    throw new Error("Primary cleaner is not assigned yet.");
  }
  if (booking.cleaner_id === cleanerId) {
    throw new Error("You are already the primary cleaner.");
  }
  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    throw new Error("This job is no longer available.");
  }

  const allocated = Number(booking.allocated_cleaners ?? 1);
  const openSlots = Math.max(0, allocated - 1);
  if (openSlots <= 0) throw new Error("This job does not need a team.");

  const { data: existing } = await admin
    .from("booking_team_members")
    .select("id,role")
    .eq("booking_id", bookingId)
    .eq("cleaner_id", cleanerId)
    .maybeSingle();
  if (existing) throw new Error("You are already on this team.");

  const { count: secondaryCount } = await admin
    .from("booking_team_members")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("role", "secondary");

  if ((secondaryCount ?? 0) >= openSlots) {
    throw new Error("All team slots are already filled.");
  }

  // Ensure primary row exists
  await admin.from("booking_team_members").upsert(
    {
      booking_id: bookingId,
      cleaner_id: booking.cleaner_id,
      role: "primary",
    },
    { onConflict: "booking_id,cleaner_id" },
  );

  const { error } = await admin.from("booking_team_members").insert({
    booking_id: bookingId,
    cleaner_id: cleanerId,
    role: "secondary",
  });
  if (error) throw new Error(error.message);

  await admin.from("matching_decisions").insert({
    booking_id: bookingId,
    cleaner_id: cleanerId,
    decision: "team_claimed",
    reasons: { offer_type: "secondary" },
  });

  const teamSize = 1 + (secondaryCount ?? 0) + 1;
  const share = Math.floor(Number(booking.amount_cleaner ?? 0) / teamSize);

  return { role: "secondary" as const, sharePence: share, success: true };
}

export async function openTeamSlotCount(bookingId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("allocated_cleaners")
    .eq("id", bookingId)
    .single();
  const allocated = Number(booking?.allocated_cleaners ?? 1);
  if (allocated <= 1) return 0;
  const { count } = await admin
    .from("booking_team_members")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("role", "secondary");
  return Math.max(0, allocated - 1 - (count ?? 0));
}
