import { NextResponse } from "next/server";

import { claimBookingDraftForUser } from "@/lib/bookings/drafts";
import { getRequestUser } from "@/lib/supabase/request-client";

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = params.token?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  try {
    const row = await claimBookingDraftForUser(token, user.id);
    if (!row) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    return NextResponse.json({ email: row.email, success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not claim draft.",
      },
      { status: 400 },
    );
  }
}
