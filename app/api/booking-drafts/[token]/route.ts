import { NextResponse } from "next/server";

import { getBookingDraftByToken } from "@/lib/bookings/drafts";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const token = params.token?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  try {
    const row = await getBookingDraftByToken(token);
    if (!row || row.completed_at) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    return NextResponse.json({
      currentStep: row.current_step,
      draft: row.draft,
      email: row.email,
      resumeToken: row.resume_token,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load booking draft.",
      },
      { status: 400 },
    );
  }
}
