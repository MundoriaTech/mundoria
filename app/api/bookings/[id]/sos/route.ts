import { NextResponse } from "next/server";
import { z } from "zod";

import {
  SAFETY_ALERT_REASONS,
  createSafetyAlert,
} from "@/lib/bookings/safety-alert";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  clientLatitude: z.number().finite().optional().nullable(),
  clientLongitude: z.number().finite().optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
  reason: z.enum(SAFETY_ALERT_REASONS),
});

/** Create a Safety alert case, page ops, and place the booking on hold. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Unable to send the alert." },
      { status: 400 },
    );
  }

  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const alert = await createSafetyAlert({
      bookingId: params.id,
      clientLatitude: parsed.data.clientLatitude,
      clientLongitude: parsed.data.clientLongitude,
      clientUserAgent: request.headers.get("user-agent"),
      note: parsed.data.note,
      reason: parsed.data.reason,
      userId: user.id,
    });
    return NextResponse.json({
      alertId: alert.id,
      createdAt: alert.created_at,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send the alert.",
      },
      { status: 400 },
    );
  }
}
