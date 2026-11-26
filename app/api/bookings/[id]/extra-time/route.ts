import { NextResponse } from "next/server";
import { z } from "zod";

import { decideExtraTime } from "@/lib/bookings/extra-time";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  decision: z.enum(["approved", "declined"]),
  extensionId: z.string().uuid(),
});

/** Customer approves or declines the cleaner's request for more time. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await decideExtraTime({
      bookingId: params.id,
      customerId: user.id,
      decision: parsed.data.decision,
      extensionId: parsed.data.extensionId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save that." },
      { status: 400 },
    );
  }
}
