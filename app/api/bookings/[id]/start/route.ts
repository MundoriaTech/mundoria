import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmCleanStart } from "@/lib/bookings/start-clean";

const schema = z.object({
  role: z.enum(["cleaner", "customer"]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Say who is confirming." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const result = await confirmCleanStart({
      bookingId: params.id,
      role: parsed.data.role,
      userId: user.id,
    });
    // A waiting charge is stored on the booking (access_penalty_pence) and
    // collected as its own payment after the main capture.
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start." },
      { status: 400 },
    );
  }
}
