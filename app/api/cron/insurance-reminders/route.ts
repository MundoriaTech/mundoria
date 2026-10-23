import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

const REMINDER_DAYS = [30, 14, 7] as const;

function dateInDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Pre-expiry reminders for verified Public Liability insurance. Fires once per
 * threshold (30 / 14 / 7 days) per policy expiry date, de-duplicated through
 * notifications of type `insurance_expiry_reminder_{days}`.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const sent: Record<number, number> = { 7: 0, 14: 0, 30: 0 };

  for (const days of REMINDER_DAYS) {
    const expiryDate = dateInDays(days);
    const type = `insurance_expiry_reminder_${days}`;

    const { data: cleaners, error } = await admin
      .from("cleaner_profiles")
      .select("id,insurance_expiry_date")
      .eq("insurance_status", "verified")
      .eq("insurance_expiry_date", expiryDate);
    if (error) {
      Sentry.captureException(error);
      continue;
    }

    for (const cleaner of cleaners ?? []) {
      try {
        const { data: existing } = await admin
          .from("notifications")
          .select("id")
          .eq("user_id", cleaner.id)
          .eq("type", type)
          .contains("data", { insurance_expiry_date: expiryDate })
          .limit(1);
        if (existing?.length) continue;

        const reason = `Your Public Liability insurance expires on ${expiryDate} (${days} days from now). Upload your renewed certificate before then so you keep receiving bookings.`;

        const { error: insertError } = await admin.from("notifications").insert({
          body: reason,
          data: {
            cleaner_id: cleaner.id,
            days_remaining: days,
            insurance_expiry_date: expiryDate,
          },
          title: `Insurance expires in ${days} days`,
          type,
          user_id: cleaner.id,
        });
        if (insertError) {
          Sentry.captureException(insertError);
          continue;
        }
        sent[days] += 1;

        const { data: profile } = await admin
          .from("profiles")
          .select("email,full_name")
          .eq("id", cleaner.id)
          .maybeSingle();
        if (process.env.RESEND_API_KEY && profile?.email) {
          await sendBrandedEmail({
            data: {
              appUrl,
              firstName: (profile.full_name as string | null)?.split(" ")[0],
              reason,
            },
            subject: `Your insurance expires in ${days} days`,
            template: "cleaner.application_needs_info",
            to: profile.email as string,
          });
        }
      } catch (reminderError) {
        Sentry.captureException(reminderError);
      }
    }
  }

  return NextResponse.json({ sent });
}
