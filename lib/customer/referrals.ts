import * as Sentry from "@sentry/nextjs";

import { formatMoney } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

export const REFERRAL_REWARD_PENCE = 1000;
export const MAX_ACTIVE_REFERRALS_PER_USER = 10;

function makePromoCode(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function createPersonalPromo({
  kind,
  ownerUserId,
  sourceReferralId,
}: {
  kind: "referral_invite" | "referral_reward";
  ownerUserId: string;
  sourceReferralId?: string | null;
}) {
  const admin = createAdminClient();
  const code = makePromoCode(kind === "referral_invite" ? "WELCOME" : "THANKS");
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 6);

  const { data, error } = await admin
    .from("promo_codes")
    .insert({
      code,
      discount_type: "fixed",
      discount_value: REFERRAL_REWARD_PENCE,
      is_active: true,
      kind,
      max_uses: 1,
      owner_user_id: ownerUserId,
      source_referral_id: sourceReferralId ?? null,
      valid_until: validUntil.toISOString(),
    })
    .select("id, code")
    .single();

  if (error) throw new Error(error.message);
  return data as { code: string; id: string };
}

export async function applyReferralAtSignup({
  refereeId,
  referralCode,
  appUrl,
}: {
  appUrl: string;
  refereeId: string;
  referralCode: string;
}) {
  const admin = createAdminClient();
  const code = referralCode.trim().toUpperCase();
  if (!code) return null;

  const { data: referrer } = await admin
    .from("profiles")
    .select("id, email, full_name, referral_code, role")
    .eq("referral_code", code)
    .eq("role", "customer")
    .maybeSingle();

  if (!referrer || referrer.id === refereeId) {
    throw new Error("That referral code is invalid.");
  }

  const { count } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referrer.id)
    .in("status", ["pending", "qualified", "rewarded"]);

  if ((count ?? 0) >= MAX_ACTIVE_REFERRALS_PER_USER) {
    throw new Error("This referral code has reached its sharing limit.");
  }

  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referee_id", refereeId)
    .maybeSingle();
  if (existing) return null;

  const { data: referral, error } = await admin
    .from("referrals")
    .insert({
      referee_id: refereeId,
      referrer_id: referrer.id,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const promo = await createPersonalPromo({
    kind: "referral_invite",
    ownerUserId: refereeId,
    sourceReferralId: referral.id,
  });

  await admin
    .from("referrals")
    .update({ referee_promo_code_id: promo.id })
    .eq("id", referral.id);

  await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", refereeId)
    .is("referred_by", null);

  const { data: referee } = await admin
    .from("profiles")
    .select("email, full_name, notification_preferences")
    .eq("id", refereeId)
    .single();

  try {
    const preferences = referee?.notification_preferences as
      | { email?: boolean }
      | undefined;
    if (referee?.email && preferences?.email !== false) {
      await sendBrandedEmail({
        data: {
          appUrl,
          code: promo.code,
          firstName: referee.full_name?.split(" ")[0],
          message: `Welcome gift applied. Use code ${promo.code} for ${formatMoney(REFERRAL_REWARD_PENCE)} off your first CleanScape booking.`,
        },
        template: "customer.promo_referral",
        to: referee.email,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
  }

  return { promoCode: promo.code, referralId: referral.id };
}

export async function resolvePromoForCheckout({
  code,
  customerId,
}: {
  code: string;
  customerId: string;
}) {
  const admin = createAdminClient();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const now = new Date().toISOString();
  const { data: promo } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .maybeSingle();

  if (promo) {
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      throw new Error("That promo code has already been used.");
    }
    if (promo.owner_user_id && promo.owner_user_id !== customerId) {
      throw new Error("That promo code belongs to another account.");
    }
    return {
      discount_type: promo.discount_type as "fixed" | "percentage",
      discount_value: Number(promo.discount_value),
      id: promo.id as string,
      kind: promo.kind as string,
    };
  }

  // Allow using a friend's public referral_code on first booking.
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, referral_code, role")
    .eq("referral_code", normalized)
    .eq("role", "customer")
    .maybeSingle();

  if (!referrer || referrer.id === customerId) {
    throw new Error("That promo code is invalid or has expired.");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", customerId)
    .single();

  const { count: completedCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("status", "completed");

  if (profile?.referred_by || (completedCount ?? 0) > 0) {
    throw new Error("Referral codes can only be used on your first booking.");
  }

  await applyReferralAtSignup({
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://cleanscapeuk.com",
    refereeId: customerId,
    referralCode: normalized,
  });

  const { data: referral } = await admin
    .from("referrals")
    .select("referee_promo_code_id")
    .eq("referee_id", customerId)
    .maybeSingle();

  if (!referral?.referee_promo_code_id) {
    throw new Error("Unable to apply that referral code.");
  }

  const { data: invitePromo } = await admin
    .from("promo_codes")
    .select("*")
    .eq("id", referral.referee_promo_code_id)
    .single();

  if (!invitePromo) throw new Error("Unable to apply that referral code.");

  return {
    discount_type: invitePromo.discount_type as "fixed" | "percentage",
    discount_value: Number(invitePromo.discount_value),
    id: invitePromo.id as string,
    kind: invitePromo.kind as string,
  };
}

export async function maybeRewardReferrer(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, customer_id, status, payment_status")
    .eq("id", bookingId)
    .single();

  if (
    !booking ||
    booking.payment_status !== "released" ||
    !["completed", "awaiting_customer_confirmation"].includes(booking.status)
  ) {
    return null;
  }

  const { data: referral } = await admin
    .from("referrals")
    .select("*")
    .eq("referee_id", booking.customer_id)
    .eq("status", "pending")
    .maybeSingle();

  if (!referral) return null;

  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", booking.customer_id)
    .in("status", ["completed", "awaiting_customer_confirmation"])
    .eq("payment_status", "released");

  if ((count ?? 0) < 1) return null;

  const reward = await createPersonalPromo({
    kind: "referral_reward",
    ownerUserId: referral.referrer_id,
    sourceReferralId: referral.id,
  });

  await admin
    .from("referrals")
    .update({
      qualifying_booking_id: bookingId,
      referrer_reward_promo_code_id: reward.id,
      rewarded_at: new Date().toISOString(),
      status: "rewarded",
    })
    .eq("id", referral.id);

  const { data: referrer } = await admin
    .from("profiles")
    .select("email, full_name, notification_preferences")
    .eq("id", referral.referrer_id)
    .single();

  await admin.from("notifications").insert({
    body: `Your friend completed their first clean. Use ${reward.code} for ${formatMoney(REFERRAL_REWARD_PENCE)} off.`,
    data: { promo_code: reward.code, referral_id: referral.id },
    title: "Referral reward unlocked",
    type: "referral_reward",
    user_id: referral.referrer_id,
  });

  try {
    const preferences = referrer?.notification_preferences as
      | { email?: boolean }
      | undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cleanscapeuk.com";
    if (referrer?.email && preferences?.email !== false) {
      await sendBrandedEmail({
        data: {
          appUrl,
          code: reward.code,
          firstName: referrer.full_name?.split(" ")[0],
          message: `Thanks for sharing CleanScape. Use ${reward.code} for ${formatMoney(REFERRAL_REWARD_PENCE)} off your next booking.`,
        },
        template: "customer.promo_referral",
        to: referrer.email,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
  }

  return reward;
}
