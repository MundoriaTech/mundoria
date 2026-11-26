import { NextResponse } from "next/server";
import { z } from "zod";

import { EXTRA_TIME_OPTIONS, requestExtraTime } from "@/lib/bookings/extra-time";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  minutes: z.number().refine((value) => (EXTRA_TIME_OPTIONS as readonly number[]).includes(value)),
  reason: z.string().trim().max(300).optional(),
});

/** Cleaner asks the customer for more time while the clean is in progress. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose 30, 60 or 90 minutes." }, { status: 400 });
  }
  try {
    const result = await requestExtraTime({
      bookingId: params.id,
      cleanerId: user.id,
      minutes: parsed.data.minutes,
      reason: parsed.data.reason,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't send the request." },
      { status: 400 },
    );
  }
}
