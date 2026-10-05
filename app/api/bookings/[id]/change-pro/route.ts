import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

import { changePro } from "@/lib/bookings/series-actions";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getRequestUser(_request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    await changePro({ bookingId: params.id, customerId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to change pro." },
      { status: 400 },
    );
  }
}
