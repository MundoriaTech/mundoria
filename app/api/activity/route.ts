import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isClientAllowedActivityEvent,
  trackUserActivity,
} from "@/lib/analytics/user-activity";
import { getRequestUser } from "@/lib/supabase/request-client";

const bodySchema = z.object({
  eventName: z.string().min(1).max(80),
  metadata: z.record(z.unknown()).optional(),
  path: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  }

  if (!isClientAllowedActivityEvent(parsed.data.eventName)) {
    return NextResponse.json({ error: "Event not allowed." }, { status: 400 });
  }

  await trackUserActivity({
    eventName: parsed.data.eventName,
    metadata: parsed.data.metadata,
    path: parsed.data.path,
    userId: user.id,
  });

  return NextResponse.json({ ok: true });
}
