import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { runMatchingEngine } from "@/lib/matching/engine";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ booking_id: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid booking_id required" }, { status: 400 });
  }
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: profile }, { data: booking }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).single(),
    admin
      .from("bookings")
      .select("customer_id")
      .eq("id", parsed.data.booking_id)
      .single(),
  ]);
  if (profile?.role !== "admin" && booking?.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    return NextResponse.json(await runMatchingEngine(parsed.data.booking_id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matching failed" },
      { status: 400 },
    );
  }
}
