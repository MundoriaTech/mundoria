import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { activateEmergencyList } from "@/lib/matching/emergency-list";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  confirmed: z.boolean(),
});

/** Cleaner response to T−24 / T−6 / T−1 confirmation gates. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,cleaner_id,confirmation_gate,status")
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .maybeSingle();

  if (!booking || booking.confirmation_gate === "none") {
    return NextResponse.json(
      { error: "No confirmation window is open for this job." },
      { status: 409 },
    );
  }

  if (parsed.data.confirmed) {
    const updates: Record<string, unknown> = {
      confirmation_responded_at: new Date().toISOString(),
    };
    if (booking.confirmation_gate === "t1") {
      updates.status = "cleaner_en_route";
    }
    await admin.from("bookings").update(updates).eq("id", params.id);
    return NextResponse.json({ success: true });
  }

  await activateEmergencyList(params.id, {
    excludeCleanerIds: [user.id],
  });
  return NextResponse.json({ success: true, reassigned: true });
}
