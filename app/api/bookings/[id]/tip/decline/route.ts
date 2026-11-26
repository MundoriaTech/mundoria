import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

/** The customer chose not to tip: remember it on the booking. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { error } = await createAdminClient()
    .from("bookings")
    .update({ tip_declined_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("customer_id", user.id)
    .is("tip_declined_at", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
