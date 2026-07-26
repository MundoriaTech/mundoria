import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const requiredStringList = (label: string) =>
  z
    .array(z.string().trim())
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(z.string()).min(1, label));

const schema = z.object({
  availability: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      end_time: requiredString("Availability end time"),
      is_available: z.boolean(),
      start_time: requiredString("Availability start time"),
    }),
  ),
  bio: z
    .string()
    .trim()
    .min(20, "Bio must be at least 20 characters")
    .max(2000, "Bio is too long"),
  dbs_document_url: requiredString("DBS certificate"),
  full_name: z.string().trim().min(2, "Full name is required"),
  id_document_url: requiredString("Government-issued ID"),
  location_tracking_consent_accepted: z.literal(true, {
    errorMap: () => ({ message: "Location consent is required" }),
  }),
  location_tracking_consent_version: z.string().trim().default("cleaner-location-consent-v1"),
  payout_preference: z.enum(["weekly", "monthly"]),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  services: requiredStringList("Select at least one service"),
  working_areas: requiredStringList("Add at least one working area"),
  years_experience: z.number().int().min(0).max(60),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role,email,stripe_account_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "cleaner") {
    return NextResponse.json({ error: "Cleaner account required" }, { status: 403 });
  }

  let stripeOnboardingComplete = false;

  if (profile.stripe_account_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripeAccount = await getStripe().accounts.retrieve(
        profile.stripe_account_id,
      );
      stripeOnboardingComplete = Boolean(
        stripeAccount.details_submitted && stripeAccount.payouts_enabled,
      );
    } catch (stripeError) {
      Sentry.captureException(stripeError);
    }
  }

  const value = parsed.data;
  const { error } = await admin
    .from("cleaner_profiles")
    .update({
      bio: value.bio,
      dbs_document_status: "pending",
      dbs_document_url: value.dbs_document_url,
      id_document_status: "pending",
      id_document_url: value.id_document_url,
      location_tracking_consent_at: new Date().toISOString(),
      location_tracking_consent_version:
        value.location_tracking_consent_version,
      onboarding_complete: true,
      payout_preference: value.payout_preference,
      stripe_onboarding_complete: stripeOnboardingComplete,
      status: "pending",
      years_experience: value.years_experience,
    })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await Promise.all([
    admin
      .from("profiles")
      .update({ full_name: value.full_name, phone: value.phone })
      .eq("id", user.id),
    admin.from("cleaner_services").delete().eq("cleaner_id", user.id),
    admin.from("cleaner_working_areas").delete().eq("cleaner_id", user.id),
    admin.from("cleaner_availability").delete().eq("cleaner_id", user.id),
  ]);
  await Promise.all([
    admin.from("cleaner_services").insert(
      value.services.map((service_type) => ({
        cleaner_id: user.id,
        service_type,
      })),
    ),
    admin.from("cleaner_working_areas").insert(
      value.working_areas.map((postcode_prefix) => ({
        cleaner_id: user.id,
        postcode_prefix: postcode_prefix.toUpperCase(),
      })),
    ),
    admin.from("cleaner_availability").insert(
      value.availability.map((day) => ({ ...day, cleaner_id: user.id })),
    ),
  ]);

  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((recipient) => ({
        body: `${value.full_name} submitted identity documents for review.`,
        data: { cleaner_id: user.id },
        title: "New cleaner application",
        type: "cleaner_application",
        user_id: recipient.id,
      })),
    );
  }
  await admin.from("admin_alert_queue").insert({
    body: `${value.full_name} submitted identity documents for review.`,
    data: { cleaner_id: user.id },
    title: "New cleaner application",
    type: "cleaner_application",
  });

  try {
    if (process.env.RESEND_API_KEY && profile.email) {
      await sendBrandedEmail({
        data: {
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
          firstName: value.full_name.split(" ")[0],
          fullName: value.full_name,
          payoutPreference: value.payout_preference,
          workingAreas: value.working_areas.join(", "),
        },
        template: "cleaner.application_submitted",
        to: profile.email,
      });
    }

    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      await sendBrandedEmail({
        data: {
          appUrl,
          cleanerEmail: profile.email,
          cleanerName: value.full_name,
          cleanerUrl: `${appUrl}/admin/cleaner/${user.id}`,
          yearsExperience: value.years_experience,
        },
        template: "admin.cleaner_application_submitted",
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
      });
    }
  } catch (emailError) {
    Sentry.captureException(emailError);
  }

  return NextResponse.json({ success: true });
}

function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Complete every onboarding step.";
}
