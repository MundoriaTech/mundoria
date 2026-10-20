import { NextResponse } from "next/server";

import { notifyEmailChangeCompleted } from "@/lib/auth/notify-email-changed";
import { getRequestUser } from "@/lib/supabase/request-client";

/** Called after the user confirms a new email (optional client refresh). */
export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await notifyEmailChangeCompleted({
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
    user,
  });

  return NextResponse.json({ success: true, ...result });
}
