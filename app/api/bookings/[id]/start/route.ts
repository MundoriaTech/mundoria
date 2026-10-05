import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmCleanStart } from "@/lib/bookings/start-clean";
import { createAdminClient } from "@/lib/supabase/admin";

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
    if (result.started && (result.penaltyPence ?? 0) > 0) {
      const admin = createAdminClient();
      const { data: booking } = await admin
        .from("bookings")
        .select("amount_total")
        .eq("id", params.id)
        .single();
      await admin
        .from("bookings")
        .update({
          amount_total:
            Number(booking?.amount_total ?? 0) + (result.penaltyPence ?? 0),
        })
        .eq("id", params.id);
    }
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start." },
      { status: 400 },
    );
  }
}
