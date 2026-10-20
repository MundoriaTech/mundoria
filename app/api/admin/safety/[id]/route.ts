import { NextResponse } from "next/server";
import { z } from "zod";

import { adminUpdateSafetyAlert } from "@/lib/bookings/safety-alert";
import { getRequestUser } from "@/lib/supabase/request-client";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  action: z.enum([
    "acknowledge",
    "in_progress",
    "resolve_continue",
    "resolve_cancel",
  ]),
  outcomeNotes: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    await adminUpdateSafetyAlert({
      action: parsed.data.action,
      adminId: user.id,
      alertId: params.id,
      outcomeNotes: parsed.data.outcomeNotes,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update the case.",
      },
      { status: 400 },
    );
  }
}
