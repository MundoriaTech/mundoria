import { NextResponse } from "next/server";

import { withdrawSafetyAlert } from "@/lib/bookings/safety-alert";
import { getRequestUser } from "@/lib/supabase/request-client";

export async function POST(
  _request: Request,
  { params }: { params: { id: string; alertId: string } },
) {
  const { user } = await getRequestUser(_request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await withdrawSafetyAlert({ alertId: params.alertId, userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to withdraw the alert.",
      },
      { status: 400 },
    );
  }
}
