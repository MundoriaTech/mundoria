import { NextResponse } from "next/server";
import { z } from "zod";

import { completeBookingDraft } from "@/lib/bookings/drafts";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  bookingId: z.string().uuid(),
});

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

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  try {
    await completeBookingDraft({
      bookingId: parsed.data.bookingId,
      resumeToken: token,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not complete draft.",
      },
      { status: 400 },
    );
  }
}
