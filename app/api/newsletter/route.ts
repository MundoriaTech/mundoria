import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONSENT_WORDING,
  logLeadEvent,
  recordConsent,
  upsertLead,
} from "@/lib/outreach/leads";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  /** The page the form sat on, for the consent record. */
  page: z.string().trim().max(200).optional(),
});

/**
 * Mag newsletter sign-up. Saves the person as a lead (source mag-newsletter,
 * or the existing lead keeps its source) with an email opt-in, so the team
 * sees them in /admin/leads and the consent is on record.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const result = await upsertLead({ email: parsed.data.email, source: "mag-newsletter" });
    if (!result) throw new Error("Newsletter lead was not saved");
    const page = parsed.data.page?.startsWith("/") ? parsed.data.page : "/blog";
    await recordConsent(result.lead.id, "email", true, "opt_in", CONSENT_WORDING.newsletterSignup, page);
    if (!result.created) {
      await logLeadEvent(result.lead.id, "newsletter.signup", "Signed up to the Mag newsletter", { page });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "We couldn't sign you up just now. Please try again." },
      { status: 500 },
    );
  }
}
