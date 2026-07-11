import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/auth";
import { captureBookingPayment } from "@/lib/payments/service";

const schema = z.object({ booking_id: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "booking_id required" }, { status: 400 });
  try {
    return NextResponse.json(await captureBookingPayment(parsed.data.booking_id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Capture failed" },
      { status: 400 },
    );
  }
}
