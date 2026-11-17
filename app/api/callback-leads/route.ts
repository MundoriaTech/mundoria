import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { storedPhone } from "@/lib/auth/uk-phone";
import { captureCallbackLead } from "@/lib/outreach/engine";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  availableIn10Min: z.boolean().optional(),
  email: z.string().trim().email("Enter a valid email address").max(254),
  firstName: z
    .string()
    .trim()
    .max(80, "First name is too long")
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
  if (phone.replace(/\D/g, "").length < 11) {
    return NextResponse.json(
      { error: "Enter a valid UK phone number." },
      { status: 400 },
    );
  }

  const firstName = parsed.data.firstName.trim() || "Guest";
  const lastName = parsed.data.lastName.trim() || "Lead";

  const admin = createAdminClient();
  const { error } = await admin.from("callback_leads").insert({
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
  });

  if (error) {
    return NextResponse.json(
      { error: "We could not save that just now. Please try again." },
      { status: 500 },
    );
  }

  // Lead automation: alert the team, start the AI call / follow-ups.
  // Never blocks or fails the form.
  try {
    await captureCallbackLead({
      availableIn10Min: parsed.data.availableIn10Min ?? false,
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
