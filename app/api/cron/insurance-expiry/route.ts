import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mark Public Liability insurance as expired once the policy date has passed.
 * Expired cleaners are excluded from matching until new cover is verified.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: expiring, error } = await admin
    .from("cleaner_profiles")
    .select("id,insurance_expiry_date,insurance_provider")
    .lt("insurance_expiry_date", today)
    .in("insurance_status", ["verified", "pending"]);
  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let expired = 0;
  for (const cleaner of expiring ?? []) {
    const { error: updateError } = await admin
      .from("cleaner_profiles")
      .update({ insurance_status: "expired" })
      .eq("id", cleaner.id)
      .in("insurance_status", ["verified", "pending"]);
    if (updateError) {
      Sentry.captureException(updateError);
      continue;
    }
    expired += 1;

    const { data: profile } = await admin
      .from("profiles")
      .select("email,full_name")
      .eq("id", cleaner.id)
      .maybeSingle();
    const name = (profile?.full_name as string | null) ?? "A cleaner";
    const reason =
      "Your Public Liability insurance has expired. Upload your renewed certificate so you can receive new bookings again.";

    await admin.from("notifications").insert({
      body: reason,
      data: {
        cleaner_id: cleaner.id,
        insurance_expiry_date: cleaner.insurance_expiry_date,
      },
      title: "Insurance expired",
      type: "insurance_expired",
      user_id: cleaner.id,
    });
    await admin.from("admin_alert_queue").insert({
      body: `${name}'s Public Liability insurance expired on ${cleaner.insurance_expiry_date}. They are excluded from matching until renewed.`,
      data: { cleaner_id: cleaner.id },
      title: "Cleaner insurance expired",
      type: "insurance_expired",
    });

    if (process.env.RESEND_API_KEY && profile?.email) {
      try {
        await sendBrandedEmail({
          data: {
            appUrl:
              process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
            firstName: name.split(" ")[0],
            reason,
          },
          template: "cleaner.application_needs_info",
          to: profile.email as string,
        });
      } catch (emailError) {
        Sentry.captureException(emailError);
      }
    }
  }

  return NextResponse.json({ expired });
}
