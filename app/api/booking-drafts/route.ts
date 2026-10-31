import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isValidBookingLeadEmail,
  upsertBookingDraftLead,
} from "@/lib/bookings/drafts";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  currentStep: z.string().max(40).nullable().optional(),
  draft: z.record(z.unknown()),
  email: z.string().trim().min(3).max(254),
  marketingOptIn: z.boolean().optional(),
  resumeToken: z.string().trim().min(16).max(128).nullable().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
  }
  if (!isValidBookingLeadEmail(parsed.data.email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const { user } = await getRequestUser(request);

  try {
    const row = await upsertBookingDraftLead({
      currentStep: parsed.data.currentStep ?? null,
      draft: parsed.data.draft as Record<string, unknown>,
      email: parsed.data.email,
      marketingOptIn: parsed.data.marketingOptIn,
      resumeToken: parsed.data.resumeToken,
      userId: user?.id ?? null,
    });
    return NextResponse.json({
      resumeToken: row.resume_token,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save booking email.",
      },
      { status: 400 },
    );
  }
}
