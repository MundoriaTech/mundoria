import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { pauseRegularClean } from "@/lib/bookings/series-actions";

const schema = z.object({
  endsOn: z.string().date(),
  startsOn: z.string().date(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a start and end date for the pause." },
      { status: 400 },
    );
  }
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const result = await pauseRegularClean({
      bookingId: params.id,
      customerId: user.id,
      endsOn: parsed.data.endsOn,
      startsOn: parsed.data.startsOn,
    });
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to pause." },
      { status: 400 },
    );
  }
}
