import { createAdminClient } from "@/lib/supabase/admin";

export type HardDeleteBlockReason =
  | "not_found"
  | "is_admin"
  | "is_self"
  | "has_customer_bookings"
  | "has_cleaner_bookings"
  | "has_payouts"
  | "has_ratings"
  | "has_disputes"
  | "has_photos"
  | "has_completions";

export type HardDeleteEligibility = {
  allowed: boolean;
  blockReason: HardDeleteBlockReason | null;
  email: string | null;
  fullName: string | null;
  role: "customer" | "cleaner" | "admin" | null;
};

const BLOCK_MESSAGES: Record<HardDeleteBlockReason, string> = {
  has_cleaner_bookings:
    "This cleaner has job history. Ban them instead of deleting.",
  has_completions:
    "This account is linked to booking confirmations and cannot be deleted.",
  has_customer_bookings:
    "This customer has bookings. Keep the account for records (or anonymise later).",
  has_disputes: "This account raised disputes and cannot be deleted.",
  has_photos: "This cleaner has booking photos and cannot be deleted.",
  has_payouts: "This cleaner has payout records and cannot be deleted.",
  has_ratings: "This account has ratings and cannot be deleted.",
  is_admin: "Admin accounts cannot be deleted from here.",
  is_self: "You cannot delete your own account.",
  not_found: "Account not found.",
};

export function hardDeleteBlockMessage(reason: HardDeleteBlockReason) {
  return BLOCK_MESSAGES[reason];
}

async function countEq(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  column: string,
  id: string,
) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, id);
  if (error) throw error;
  return count ?? 0;
}

/** True only for spam/unused customer or cleaner accounts with no ops history. */
export async function getHardDeleteEligibility(input: {
  actorAdminId: string;
  userId: string;
}): Promise<HardDeleteEligibility> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", input.userId)
    .maybeSingle();

  if (!profile) {
    return {
      allowed: false,
      blockReason: "not_found",
      email: null,
      fullName: null,
      role: null,
    };
  }

  const role = profile.role as HardDeleteEligibility["role"];
  const base = {
    email: profile.email as string,
    fullName: profile.full_name as string,
    role,
  };

  if (profile.id === input.actorAdminId) {
    return { ...base, allowed: false, blockReason: "is_self" };
  }
  if (profile.role === "admin") {
    return { ...base, allowed: false, blockReason: "is_admin" };
  }
  if (profile.role !== "customer" && profile.role !== "cleaner") {
    return { ...base, allowed: false, blockReason: "not_found" };
  }

  const [
    customerBookings,
    cleanerBookings,
    payouts,
    ratingsAsCustomer,
    ratingsAsCleaner,
    disputes,
    photos,
    completions,
  ] = await Promise.all([
    countEq(admin, "bookings", "customer_id", input.userId),
    countEq(admin, "bookings", "cleaner_id", input.userId),
    countEq(admin, "payouts", "cleaner_id", input.userId),
    countEq(admin, "ratings", "customer_id", input.userId),
    countEq(admin, "ratings", "cleaner_id", input.userId),
    countEq(admin, "disputes", "raised_by", input.userId),
    countEq(admin, "booking_photos", "cleaner_id", input.userId),
    countEq(admin, "booking_completion_confirmations", "customer_id", input.userId),
  ]);

  if (customerBookings > 0) {
    return { ...base, allowed: false, blockReason: "has_customer_bookings" };
  }
  if (cleanerBookings > 0) {
    return { ...base, allowed: false, blockReason: "has_cleaner_bookings" };
  }
  if (payouts > 0) {
    return { ...base, allowed: false, blockReason: "has_payouts" };
  }
  if (ratingsAsCustomer > 0 || ratingsAsCleaner > 0) {
    return { ...base, allowed: false, blockReason: "has_ratings" };
  }
  if (disputes > 0) {
    return { ...base, allowed: false, blockReason: "has_disputes" };
  }
  if (photos > 0) {
    return { ...base, allowed: false, blockReason: "has_photos" };
  }
  if (completions > 0) {
    return { ...base, allowed: false, blockReason: "has_completions" };
  }

  return { ...base, allowed: true, blockReason: null };
}

/**
 * Hard-delete an eligible unused account. Caller must check eligibility first.
 * Clears NO ACTION pointers, then deletes auth.users (profiles cascade).
 */
export async function hardDeleteUnusedUser(userId: string) {
  const admin = createAdminClient();

  await admin
    .from("cleaner_profiles")
    .update({ interview_completed_by: null })
    .eq("interview_completed_by", userId);

  await admin
    .from("bookings")
    .update({ previous_cleaner_id: null })
    .eq("previous_cleaner_id", userId);

  await admin.from("matching_decisions").delete().eq("cleaner_id", userId);
  await admin.from("cleaner_job_responses").delete().eq("cleaner_id", userId);
  await admin.from("messages").delete().eq("sender_id", userId);
  await admin.from("messages").delete().eq("receiver_id", userId);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message || "Unable to delete auth user");
  }
}
