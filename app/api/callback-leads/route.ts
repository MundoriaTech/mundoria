import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { notifyCallbackDeskChange } from "@/lib/admin/notify-callback-desk";
import { isValidUkPhone, storedPhone } from "@/lib/auth/uk-phone";
import { outreachEnabled } from "@/lib/outreach/config";
import { captureCallbackLead } from "@/lib/outreach/engine";
import { createAdminClient } from "@/lib/supabase/admin";

const attributionSchema = z
  .object({
    fbclid: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    landing_path: z.string().max(200).optional(),
    referrer: z.string().max(300).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_source: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    captured_at: z.string().max(40).optional(),
  })
  .partial()
  .optional()
  .nullable();

const schema = z.object({
  attribution: attributionSchema,
  availableIn10Min: z.boolean().optional(),
  email: z.string().trim().email("Enter a valid email address").max(254),
  firstName: z
    .string()
    .trim()
    .max(80, "First name is too long")
    .optional()
    .default(""),
  fullName: z
    .string()
    .trim()
    .max(120, "Name is too long")
    .optional()
    .default(""),
  lastName: z
    .string()
    .trim()
    .max(80, "Last name is too long")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(30, "Phone number is too long"),
  source: z.string().trim().max(80).optional(),
  utmCampaign: z.string().trim().max(120).optional().nullable(),
  utmMedium: z.string().trim().max(120).optional().nullable(),
  utmSource: z.string().trim().max(120).optional().nullable(),
});

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Guest", lastName: "Lead" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "Lead" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const phone = storedPhone(parsed.data.phone);
  if (!isValidUkPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid UK phone number." },
      { status: 400 },
    );
  }

  const fromFull = splitFullName(parsed.data.fullName);
  // callback_leads caps each name at 80 characters; a long full name would 500.
  const firstName = (parsed.data.firstName.trim() || fromFull.firstName || "Guest").slice(0, 80);
  const lastName = (parsed.data.lastName.trim() || fromFull.lastName || "Lead").slice(0, 80);

  const admin = createAdminClient();
  const callbackRow = {
    available_in_10_min: parsed.data.availableIn10Min ?? false,
    email: parsed.data.email.toLowerCase(),
    first_name: firstName,
    last_name: lastName,
    phone,
    source: parsed.data.source?.trim() || "book-2-get-1-free",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    utm_campaign: parsed.data.utmCampaign?.trim() || null,
    utm_medium: parsed.data.utmMedium?.trim() || null,
    utm_source: parsed.data.utmSource?.trim() || null,
  };
  const attribution = parsed.data.attribution && Object.keys(parsed.data.attribution).length ? parsed.data.attribution : null;
  let { data: callback, error } = await admin
    .from("callback_leads")
    .insert({ ...callbackRow, attribution })
    .select("id")
    .single();
  // Before the attribution migration is applied, save without it.
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ data: callback, error } = await admin.from("callback_leads").insert(callbackRow).select("id").single());
  }

  if (error || !callback) {
    return NextResponse.json(
      { error: "We could not save that just now. Please try again." },
      { status: 500 },
    );
  }

  if (!outreachEnabled()) {
    try {
      await notifyCallbackDeskChange({
        isNew: true,
        source: parsed.data.source?.trim() || "book-2-get-1-free",
        lead: {
          email: parsed.data.email,
          first_name: firstName,
          id: callback.id,
          last_name: lastName,
          phone,
        },
        summary: parsed.data.availableIn10Min
          ? "They said they can take a call in the next 10 minutes."
          : "They asked us to call them back.",
      });
    } catch (notifyError) {
      Sentry.captureException(notifyError);
    }
  }

  // Lead automation: alert the team, start the AI call / follow-ups.
  // Never blocks or fails the form.
  try {
    await captureCallbackLead({
      availableIn10Min: parsed.data.availableIn10Min ?? false,
      callbackId: callback.id,
      email: parsed.data.email,
      firstName,
      lastName,
      phone,
      source: parsed.data.source?.trim() || "book-2-get-1-free",
      utmCampaign: parsed.data.utmCampaign,
      utmMedium: parsed.data.utmMedium,
      utmSource: parsed.data.utmSource,
    });
  } catch (captureError) {
    Sentry.captureException(captureError);
  }

  return NextResponse.json({ ok: true });
}
