import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { formatMoney } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { getStripe } from "@/lib/stripe/server";

const schema = z.object({
  action: z.enum([
    "refund",
    "deduct",
    "resolve",
    "close",
    "uphold_rating",
    "reject_rating",
  ]),
  amount: z.number().int().positive().optional(),
  notes: z.string().trim().min(3),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }
  const { data: dispute } = await auth.admin
    .from("disputes")
    .select("*,booking:bookings(*)")
    .eq("id", params.id)
    .single();
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  const { action, amount, notes } = parsed.data;

  if (action === "refund" && dispute.booking?.stripe_payment_intent_id) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(
      dispute.booking.stripe_payment_intent_id,
    );
    if (intent.status === "succeeded") {
      await stripe.refunds.create({
        amount: amount ?? intent.amount_received,
        payment_intent: intent.id,
        reason: "requested_by_customer",
      });
    } else if (!["canceled", "requires_payment_method"].includes(intent.status)) {
      await stripe.paymentIntents.cancel(intent.id);
    }
    await auth.admin
      .from("bookings")
      .update({ payment_status: "refunded" })
      .eq("id", dispute.booking_id);
  }

  if (action === "deduct") {
    if (!dispute.booking?.cleaner_id) {
      return NextResponse.json(
        { error: "This dispute has no assigned cleaner to deduct from." },
        { status: 400 },
      );
    }
    const deduction = amount ?? dispute.booking.amount_cleaner ?? 0;
    if (deduction <= 0) {
      return NextResponse.json(
        { error: "Enter a positive deduction amount." },
        { status: 400 },
      );
    }
    const { data: pending } = await auth.admin
      .from("payouts")
      .select("id,net_amount")
      .eq("cleaner_id", dispute.booking.cleaner_id)
      .in("status", ["pending", "processing"])
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!pending) {
      return NextResponse.json(
        {
          error:
            "No pending payout found for this cleaner. Create or wait for a payout period before deducting.",
        },
        { status: 400 },
      );
    }
    await auth.admin
      .from("payouts")
      .update({ net_amount: Math.max(0, pending.net_amount - deduction) })
      .eq("id", pending.id);
  }

  if (action === "uphold_rating" || action === "reject_rating") {
    if (!dispute.rating_id) {
      return NextResponse.json(
        { error: "This dispute is not linked to a rating." },
        { status: 400 },
      );
    }
    const { error } = await auth.admin.rpc(
      action === "uphold_rating"
        ? "void_rating_from_medallion"
        : "apply_rating_to_medallion",
      {
        actor_id: auth.user.id,
        resolution_notes: notes,
        target_rating_id: dispute.rating_id,
      },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const status = action === "close" ? "closed" : "resolved";
  await auth.admin
    .from("disputes")
    .update({
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
      resolved_by: auth.user.id,
      status,
    })
    .eq("id", params.id);
  await notifyDisputeOutcome({
    action,
    admin: auth.admin,
    amount: amount ?? null,
    dispute,
    notes,
    requestUrl: request.url,
  }).catch(() => undefined);
  await logAdminAction({
    action: `dispute_${action}`,
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "dispute",
    metadata: { amount },
    reason: notes,
  });
  return NextResponse.json({ success: true });
}

type Party = "customer" | "cleaner";

/**
 * Tell people how their dispute ended, with the admin's resolution note.
 * The person who raised it always hears. For booking disputes the other
 * party hears too; rating disputes (a cleaner challenging a rating) only go
 * back to the cleaner.
 */
async function notifyDisputeOutcome({
  action,
  admin,
  amount,
  dispute,
  notes,
  requestUrl,
}: {
  action: string;
  admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["admin"];
  amount: number | null;
  dispute: {
    booking?: {
      amount_cleaner?: number | null;
      cleaner_id?: string | null;
      customer_id?: string | null;
    } | null;
    booking_id: string;
    raised_by: string;
    rating_id?: string | null;
  };
  notes: string;
  requestUrl: string;
}) {
  const booking = dispute.booking ?? {};
  const roles = new Map<string, Party>();
  if (booking.customer_id) roles.set(booking.customer_id, "customer");
  if (booking.cleaner_id) roles.set(booking.cleaner_id, "cleaner");
  const raisedRole = roles.get(dispute.raised_by);
  const recipients = dispute.rating_id
    ? raisedRole
      ? [dispute.raised_by]
      : []
    : Array.from(roles.keys());
  if (!recipients.length) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(requestUrl).origin;
  const { data: people } = await admin
    .from("profiles")
    .select("id,email,full_name,notification_preferences")
    .in("id", recipients);

  for (const person of people ?? []) {
    const role = roles.get(person.id as string);
    if (!role) continue;
    const outcome = outcomeLine(action, role, amount);
    const body = `${outcome} Note from Mundoria: ${notes}`;
    const title = action === "close" ? "Dispute closed" : "Dispute resolved";
    const prefs = (person.notification_preferences ?? {}) as {
      email?: boolean;
      push?: boolean;
    };
    const data = { booking_id: dispute.booking_id };

    await createInAppNotification(person.id as string, "dispute_resolved", title, body, data);
    if (prefs.push !== false) {
      await sendPushNotification(person.id as string, title, body, data);
    }
    if (person.email && prefs.email !== false) {
      const fullName = (person.full_name as string | null) ?? "";
      await sendBrandedEmail(
        role === "customer"
          ? {
              data: {
                appUrl,
                bookingId: dispute.booking_id,
                bookingUrl: `${appUrl}/booking/${dispute.booking_id}`,
                firstName: fullName.split(" ")[0] || undefined,
                resolution: body,
                status: title,
              },
              template: "customer.dispute_resolved",
              to: person.email as string,
            }
          : {
              data: {
                appUrl,
                body: outcome,
                firstName: fullName.split(" ")[0] || undefined,
                reason: notes,
                title,
              },
              template: "cleaner.account_update",
              to: person.email as string,
            },
      );
    }
  }
}

function outcomeLine(action: string, role: Party, amount: number | null) {
  const money = amount ? formatMoney(amount) : null;
  switch (action) {
    case "refund":
      return role === "customer"
        ? `We've refunded ${money ?? "your payment"} to your card.`
        : "We've reviewed the dispute and refunded the customer.";
    case "deduct":
      return role === "cleaner"
        ? `${money ?? "An amount"} will be deducted from your next payout.`
        : "We've reviewed the dispute and taken action with the cleaner.";
    case "uphold_rating":
      return "We've reviewed the rating and removed it from your score.";
    case "reject_rating":
      return "We've reviewed the rating and it stays on your score.";
    case "close":
      return "We've reviewed the dispute and closed it.";
    default:
      return "We've reviewed the dispute and marked it as resolved.";
  }
}
